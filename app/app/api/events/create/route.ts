
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

interface VenueRow extends RowDataPacket {
  type: string;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to create an event.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      event_title,
      sport_type,
      event_date,
      start_time,
      end_time,
      max_players,
      venue_id,
    } = body;

    if (
      typeof event_title !== "string" ||
      !event_title.trim() ||
      typeof sport_type !== "string" ||
      !sport_type.trim() ||
      typeof event_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(event_date) ||
      typeof start_time !== "string" ||
      !/^\d{2}:\d{2}$/.test(start_time) ||
      typeof end_time !== "string" ||
      !/^\d{2}:\d{2}$/.test(end_time) ||
      start_time >= end_time ||
      !Number.isInteger(max_players) ||
      max_players <= 0 ||
      !Number.isInteger(venue_id) ||
      venue_id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter valid event details.",
        },
        { status: 400 }
      );
    }

    const [venues] = await pool.query<VenueRow[]>(
      "select type from venue where venue_id = ?",
      [venue_id]
    );

    if (venues.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected venue does not exist.",
        },
        { status: 404 }
      );
    }

    if (
      venues[0].type.trim().toLowerCase() !==
      sport_type.trim().toLowerCase()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected venue does not support this sport.",
        },
        { status: 409 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `insert into event
        (event_title, sport_type, event_date,
         start_time, end_time, max_players,
         created_by_user_id, venue_id)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_title.trim(),
        sport_type.trim(),
        event_date,
        start_time,
        end_time,
        max_players,
        session.userId,
        venue_id,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Event created successfully.",
        event_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create event error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create event.",
      },
      { status: 500 }
    );
  }
}
