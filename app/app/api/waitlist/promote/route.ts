import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getRedis } from "@/lib/redis";
import type { RowDataPacket } from "mysql2";

interface WaitingUser extends RowDataPacket {
  waitlist_id: number;
  user_id: number;
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { success: false, message: "Development only" },
      { status: 403 }
    );
  }

  let promoted = false;

  try {
    const body = await request.json();
    const eventId = body.event_id;

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid event ID" },
        { status: 400 }
      );
    }

    // MySQL is the source of truth.
    await pool.query(
      "call sp_promote_waitlist(?)",
      [eventId]
    );

    promoted = true;

    // Rebuild this event's Redis queue from MySQL.
    const [rows] = await pool.query<WaitingUser[]>(
      `select waitlist_id, user_id
       from waitlist
       where event_id = ?
         and status = 'waiting'
       order by joined_time, waitlist_id`,
      [eventId]
    );

    const redis = await getRedis();
    const key = `playo:waitlist:event:${eventId}`;

    const transaction = redis.multi().del(key);

    if (rows.length > 0) {
      transaction.zAdd(
        key,
        rows.map((row) => ({
          score: row.waitlist_id,
          value: String(row.user_id),
        }))
      );
    }

    await transaction.exec();

    return NextResponse.json({
      success: true,
      message: "User promoted and Redis queue synchronized",
      event_id: eventId,
      remaining_waiting_users: rows.length,
    });
  } catch (error) {
    console.error("Waitlist promotion failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: promoted
          ? "MySQL promotion committed, but Redis synchronization failed"
          : "Waitlist promotion failed",
        mysql_promotion_committed: promoted,
      },
      { status: 500 }
    );
  }
}
