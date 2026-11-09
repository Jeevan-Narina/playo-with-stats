
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    // Expire overdue unpaid bookings belonging to this user.
    await pool.query(
      `UPDATE booking
       SET status = 'expired'
       WHERE user_id = ?
         AND status = 'pending'
         AND created_at <= NOW() - INTERVAL 15 MINUTE`,
      [session.userId]
    );

    // Return only this user's personal bookings.
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         b.booking_id,
         v.name AS venue_name,
         vc.court_name,
         b.booking_date,
         b.booking_time,
         b.duration,
         b.amount,
         b.status
       FROM booking b
       JOIN venue v
         ON b.venue_id = v.venue_id
       LEFT JOIN venue_court vc
         ON b.court_id = vc.court_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC,
                b.booking_time DESC`,
      [session.userId]
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Booking retrieval failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve bookings.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      venue_id,
      court_id,
      booking_date,
      booking_time,
      duration,
    } = body;

    if (
      !Number.isInteger(venue_id) ||
      venue_id <= 0 ||
      !Number.isInteger(court_id) ||
      court_id <= 0 ||
      typeof booking_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(booking_date) ||
      typeof booking_time !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(
        booking_time
      ) ||
      !Number.isInteger(duration) ||
      duration < 30 ||
      duration > 1410 ||
      duration % 30 !== 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid booking details.",
        },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      await connection.query(
        `CALL sp_create_booking(
          ?, ?, ?, ?, ?, ?, @new_booking_id
        )`,
        [
          session.userId,
          venue_id,
          court_id,
          booking_date,
          booking_time,
          duration,
        ]
      );

      const [result] =
        await connection.query<RowDataPacket[]>(
          "SELECT @new_booking_id AS booking_id"
        );

      const bookingId = Number(result[0]?.booking_id);

      if (
        !Number.isInteger(bookingId) ||
        bookingId <= 0
      ) {
        throw new Error("Booking ID was not returned.");
      }

      return NextResponse.json(
        {
          success: true,
          message:
            "Court reserved. Complete payment within 15 minutes.",
          booking_id: bookingId,
          payment_required: true,
        },
        { status: 201 }
      );
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    console.error("Booking creation failed:", error);

    const dbError = error as {
      sqlState?: string;
      sqlMessage?: string;
    };

    if (dbError.sqlState === "45000") {
      return NextResponse.json(
        {
          success: false,
          message:
            dbError.sqlMessage || "Booking rejected.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create booking.",
      },
      { status: 500 }
    );
  }
}
