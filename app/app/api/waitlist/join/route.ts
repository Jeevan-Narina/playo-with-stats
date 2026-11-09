
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getRedis } from "@/lib/redis";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

interface WaitingUser extends RowDataPacket {
  waitlist_id: number;
  user_id: number;
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Please log in to join the waitlist.",
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const event_id = Number(body.event_id);

    if (!Number.isInteger(event_id) || event_id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID.",
        },
        { status: 400 }
      );
    }

    // Use the logged-in user's ID, never an ID from the browser.
    const user_id = session.userId;

    // MySQL checks capacity and prevents duplicate waitlist entries.
    await pool.query(
      "call sp_join_event_waitlist(?, ?)",
      [event_id, user_id]
    );

    // Synchronize Redis with the committed MySQL waitlist.
    let redisSynced = true;

    try {
      const [rows] = await pool.query<WaitingUser[]>(
        `select waitlist_id, user_id
         from waitlist
         where event_id = ? and status = 'waiting'
         order by joined_time, waitlist_id`,
        [event_id]
      );

      const redis = await getRedis();
      const key = `playo:waitlist:event:${event_id}`;

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
    } catch (redisError) {
      redisSynced = false;
      console.error("Waitlist Redis sync failed:", redisError);
    }

    return NextResponse.json({
      success: true,
      message: "Successfully joined the event waitlist.",
      redis_synced: redisSynced,
    });
  } catch (error: unknown) {
    const dbError = error as {
      sqlState?: string;
      sqlMessage?: string;
    };

    if (dbError.sqlState === "45000") {
      return NextResponse.json(
        {
          success: false,
          message: dbError.sqlMessage || "Waitlist request rejected.",
        },
        { status: 409 }
      );
    }

    console.error("Waitlist joining failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to join the waitlist.",
      },
      { status: 500 }
    );
  }
}
