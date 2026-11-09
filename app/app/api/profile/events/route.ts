
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface RegisteredEvent extends RowDataPacket {
  event_id: number;
  event_title: string;
  sport_type: string;
  event_date: string;
  venue_name: string;
  registration_status: string;
  registered_at: Date;
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in first.",
        },
        { status: 401 }
      );
    }

    const [events] = await pool.query<RegisteredEvent[]>(
      `select
         e.event_id,
         e.event_title,
         e.sport_type,
         date_format(e.event_date, '%Y-%m-%d') as event_date,
         v.name as venue_name,
         er.status as registration_status,
         er.registered_at
       from event_registration er
       join event e on er.event_id = e.event_id
       join venue v on e.venue_id = v.venue_id
       where er.user_id = ?
       order by er.registered_at desc`,
      [session.userId]
    );

    return NextResponse.json({
      success: true,
      total_events: events.length,
      events,
    });
  } catch (error) {
    console.error("Failed to load registered events:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load your sports activities.",
      },
      { status: 500 }
    );
  }
}
