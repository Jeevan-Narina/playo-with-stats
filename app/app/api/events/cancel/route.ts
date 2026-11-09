
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getRedis } from "@/lib/redis";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

interface RegistrationRow extends RowDataPacket {
  registration_id: number;
}

interface WaitlistRow extends RowDataPacket {
  waitlist_id: number;
  user_id: number;
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Please log in to cancel a registration.",
      },
      { status: 401 }
    );
  }

  let conn;

  try {
    const body = await request.json();
    const event_id = Number(body.event_id);
    const user_id = session.userId;

    if (!Number.isInteger(event_id) || event_id <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid event ID." },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Lock the event to serialize capacity changes.
    const [events] = await conn.query<RowDataPacket[]>(
      "select event_id from event where event_id = ? for update",
      [event_id]
    );

    if (events.length === 0) {
      throw new Error("Event not found.");
    }

    // Only cancel the logged-in user's registration.
    const [registrations] = await conn.query<RegistrationRow[]>(
      `select registration_id
       from event_registration
       where event_id = ?
         and user_id = ?
         and status = 'registered'
       for update`,
      [event_id, user_id]
    );

    if (registrations.length === 0) {
      throw new Error("You are not registered for this event.");
    }

    await conn.query(
      `update event_registration
       set status = 'cancelled'
       where registration_id = ?`,
      [registrations[0].registration_id]
    );

    // Find the earliest eligible waitlisted user.
    const [waiting] = await conn.query<WaitlistRow[]>(
      `select w.waitlist_id, w.user_id
       from waitlist w
       where w.event_id = ?
         and w.status = 'waiting'
         and not exists (
           select 1
           from event_registration er
           where er.event_id = w.event_id
             and er.user_id = w.user_id
             and er.status = 'registered'
         )
       order by w.joined_time, w.waitlist_id
       limit 1
       for update`,
      [event_id]
    );

    let promotedUserId: number | null = null;

    if (waiting.length > 0) {
      const next = waiting[0];

      await conn.query(
        `insert into event_registration
           (event_id, user_id, status)
         values (?, ?, 'registered')
         on duplicate key update
           status = 'registered'`,
        [event_id, next.user_id]
      );

      await conn.query(
        `update waitlist
         set status = 'promoted'
         where waitlist_id = ?`,
        [next.waitlist_id]
      );

      promotedUserId = next.user_id;
    }

    await conn.commit();
    conn.release();
    conn = undefined;

    // MySQL is authoritative; Redis caches the waiting queue.
    let redisSynced = true;

    try {
      const [remaining] = await pool.query<WaitlistRow[]>(
        `select waitlist_id, user_id
         from waitlist
         where event_id = ?
           and status = 'waiting'
         order by joined_time, waitlist_id`,
        [event_id]
      );

      const redis = await getRedis();
      const key = `playo:waitlist:event:${event_id}`;

      const transaction = redis.multi().del(key);

      if (remaining.length > 0) {
        transaction.zAdd(
          key,
          remaining.map((row) => ({
            score: row.waitlist_id,
            value: String(row.user_id),
          }))
        );
      }

      await transaction.exec();
    } catch (redisError) {
      redisSynced = false;
      console.error("Redis synchronization failed:", redisError);
    }

    return NextResponse.json({
      success: true,
      message:
        promotedUserId !== null
          ? `Registration cancelled. User ${promotedUserId} promoted from waitlist.`
          : "Registration cancelled successfully.",
      promoted_user_id: promotedUserId,
      redis_synced: redisSynced,
    });
  } catch (error: unknown) {
    if (conn) {
      await conn.rollback();
      conn.release();
    }

    console.error("Cancellation error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Cancellation failed.",
      },
      { status: 400 }
    );
  }
}
