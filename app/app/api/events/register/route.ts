
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to join an event.",
        },
        { status: 401 }
      );
    }

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

    await pool.query("call sp_register_for_event(?, ?)", [
      event_id,
      session.userId,
    ]);

    return NextResponse.json({
      success: true,
      message: "Event registration successful!",
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
          message: dbError.sqlMessage || "Registration rejected.",
        },
        { status: 409 }
      );
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Event registration failed.",
      },
      { status: 500 }
    );
  }
}
