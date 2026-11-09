
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

interface EventRow extends RowDataPacket {
  created_by_user_id: number;
  registered_players: number;
}

export async function PUT(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        message: "Please log in to edit an event.",
      },
      { status: 401 }
    );
  }

  let conn;

  try {
    const body = await request.json();

    const {
      event_id,
      event_title,
      sport_type,
      event_date,
      start_time,
      end_time,
      max_players,
    } = body;

    if (
      !Number.isInteger(event_id) ||
      event_id <= 0 ||
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
      max_players <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter valid event details.",
        },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Lock the event while checking organizer and capacity.
    const [events] = await conn.query<EventRow[]>(
      `select
         e.created_by_user_id,
         (
           select count(*)
           from event_registration er
           where er.event_id = e.event_id
             and er.status = 'registered'
         ) as registered_players
       from event e
       where e.event_id = ?
       for update`,
      [event_id]
    );

    if (events.length === 0) {
      await conn.rollback();

      return NextResponse.json(
        { success: false, message: "Event not found." },
        { status: 404 }
      );
    }

    if (events[0].created_by_user_id !== session.userId) {
      await conn.rollback();

      return NextResponse.json(
        {
          success: false,
          message: "Only the event organizer can edit this event.",
        },
        { status: 403 }
      );
    }

    if (max_players < Number(events[0].registered_players)) {
      await conn.rollback();

      return NextResponse.json(
        {
          success: false,
          message:
            "Maximum players cannot be below current registrations.",
        },
        { status: 409 }
      );
    }

    const [result] = await conn.query<ResultSetHeader>(
      `update event
       set event_title = ?,
           sport_type = ?,
           event_date = ?,
           start_time = ?,
           end_time = ?,
           max_players = ?
       where event_id = ?`,
      [
        event_title.trim(),
        sport_type.trim(),
        event_date,
        start_time,
        end_time,
        max_players,
        event_id,
      ]
    );

    await conn.commit();

    return NextResponse.json({
      success: true,
      message: "Event updated successfully.",
      affected_rows: result.affectedRows,
    });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }

    console.error("Event update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update event.",
      },
      { status: 500 }
    );
  } finally {
    conn?.release();
  }
}
