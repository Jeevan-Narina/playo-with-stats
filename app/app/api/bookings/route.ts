import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `select b.booking_id, v.name as venue_name,
              b.booking_date, b.booking_time,
              b.duration, b.amount, b.status
       from booking b
       join venue v on b.venue_id = v.venue_id
       order by b.booking_date, b.booking_time`
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Booking retrieval failed:", error);

    return NextResponse.json(
      { success: false, message: "Failed to retrieve bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { venue_id, booking_date, booking_time, duration } = body;

    if (
      !Number.isInteger(venue_id) ||
      venue_id <= 0 ||
      typeof booking_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(booking_date) ||
      typeof booking_time !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(booking_time) ||
      !Number.isInteger(duration) ||
      duration <= 0 ||
      duration > 1439
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid booking details" },
        { status: 400 }
      );
    }

    await pool.query(
      "call sp_create_booking(?, ?, ?, ?)",
      [venue_id, booking_date, booking_time, duration]
    );

    return NextResponse.json(
      { success: true, message: "Booking confirmed successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Booking creation failed:", error);

    const dbError = error as { sqlState?: string; sqlMessage?: string };

    if (dbError.sqlState === "45000") {
      return NextResponse.json(
        {
          success: false,
          message: dbError.sqlMessage || "Booking rejected",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to create booking" },
      { status: 500 }
    );
  }
}
