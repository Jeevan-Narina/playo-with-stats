import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getRedis } from "@/lib/redis";
import type { RowDataPacket } from "mysql2";

interface WaitlistRow extends RowDataPacket {
  event_id: number;
  user_id: number;
  waitlist_id: number;
}

export async function POST() {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { success: false, message: "Development only" },
        { status: 403 }
      );
    }

    const [rows] = await pool.query<WaitlistRow[]>(
      `select waitlist_id, event_id, user_id
       from waitlist
       where status = 'waiting'
       order by joined_time, waitlist_id`
    );

    const redis = await getRedis();

    const eventIds = [...new Set(rows.map((row) => row.event_id))];

    for (const eventId of eventIds) {
      const key = `playo:waitlist:event:${eventId}`;
      const members = rows
        .filter((row) => row.event_id === eventId)
        .map((row) => ({
          score: row.waitlist_id,
          value: String(row.user_id),
        }));

      await redis.del(key);

      if (members.length > 0) {
        await redis.zAdd(key, members);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Waiting users synchronized from MySQL to Redis",
      synchronized_users: rows.length,
      synchronized_events: eventIds.length,
    });
  } catch (error) {
    console.error("Waitlist synchronization failed:", error);

    return NextResponse.json(
      { success: false, message: "Waitlist synchronization failed" },
      { status: 500 }
    );
  }
}
