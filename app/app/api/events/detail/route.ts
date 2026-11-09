
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface EventDetails extends RowDataPacket {
  event_id: number;
  event_title: string;
  sport_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  max_players: number;
  created_by_user_id: number;
}

export async function GET(request: NextRequest) {
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

    const eventId = Number(
      request.nextUrl.searchParams.get("id")
    );

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID.",
        },
        { status: 400 }
      );
    }

    const [events] = await pool.query<EventDetails[]>(
      `select
         event_id,
         event_title,
         sport_type,
         date_format(event_date, '%Y-%m-%d') as event_date,
         time_format(start_time, '%H:%i') as start_time,
         time_format(end_time, '%H:%i') as end_time,
         max_players,
         created_by_user_id
       from event
       where event_id = ?`,
      [eventId]
    );

    if (events.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found.",
        },
        { status: 404 }
      );
    }

    // Only the organizer may load event details for editing.
    if (events[0].created_by_user_id !== session.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Only the organizer can edit this event.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      event: events[0],
    });
  } catch (error) {
    console.error("Event details error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load event details.",
      },
      { status: 500 }
    );
  }
}
