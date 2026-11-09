
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

interface EventRow extends RowDataPacket {
  created_by_user_id: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export async function DELETE(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Please log in first." },
      { status: 401 }
    );
  }

  let conn;

  try {
    const body = await request.json();
    const event_id = body.event_id;

    if (!Number.isInteger(event_id) || event_id <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid event ID." },
        { status: 400 }
      );
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [events] = await conn.query<EventRow[]>(
      `select created_by_user_id
       from event
       where event_id = ?
       for update`,
      [event_id]
    );

    if (events.length === 0) {
      return NextResponse.json(
        { success: false, message: "Event not found." },
        { status: 404 }
      );
    }

    if (events[0].created_by_user_id !== session.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Only the organizer can delete this event.",
        },
        { status: 403 }
      );
    }

    const [registrations] = await conn.query<CountRow[]>(
      `select count(*) as total
       from event_registration
       where event_id = ? and status = 'registered'`,
      [event_id]
    );

    const [waiting] = await conn.query<CountRow[]>(
      `select count(*) as total
       from waitlist
       where event_id = ? and status = 'waiting'`,
      [event_id]
    );

    if (
      Number(registrations[0].total) > 0 ||
      Number(waiting[0].total) > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete an event with active registrations or waiting users.",
        },
        { status: 409 }
      );
    }

    const [result] = await conn.query<ResultSetHeader>(
      "delete from event where event_id = ?",
      [event_id]
    );

    await conn.commit();

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully.",
      deleted_rows: result.affectedRows,
    });
  } catch (error) {
    console.error("Delete event error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to delete event. It may have related matches or records.",
      },
      { status: 500 }
    );
  } finally {
    if (conn) {
      await conn.rollback().catch(() => {});
      conn.release();
    }
  }
}
