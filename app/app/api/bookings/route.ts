
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

// ============================================================
// PLAYO WITH STATS - PERSONAL BOOKINGS API
// ============================================================
// GET:
// Retrieve bookings for the logged-in user.
//
// POST:
// Create new court bookings using MySQL stored procedure.
//
// DATE FIX:
// DATE_FORMAT returns booking_date as YYYY-MM-DD.
// This prevents MySQL DATE values from shifting by one day
// during JavaScript timezone conversion.
// ============================================================

// ============================================================
// GET - RETRIEVE PERSONAL BOOKINGS
// ============================================================

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in.",
        },
        { status: 401 }
      );
    }

    // Expire unpaid bookings after 15 minutes.
    await pool.query(
      `UPDATE booking
       SET status = 'expired'
       WHERE user_id = ?
         AND status = 'pending'
         AND created_at <= NOW() - INTERVAL 15 MINUTE`,
      [session.userId]
    );

    // Retrieve this user's bookings.
    // DATE_FORMAT prevents the one-day date shift.
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         b.booking_id,
         v.name AS venue_name,
         vc.court_name,

         DATE_FORMAT(
           b.booking_date,
           '%Y-%m-%d'
         ) AS booking_date,

         TIME_FORMAT(
           b.booking_time,
           '%H:%i:%s'
         ) AS booking_time,

         b.duration,
         b.amount,
         b.status

       FROM booking b

       JOIN venue v
         ON b.venue_id = v.venue_id

       LEFT JOIN venue_court vc
         ON b.court_id = vc.court_id

       WHERE b.user_id = ?

       ORDER BY
         b.booking_date DESC,
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

// ============================================================
// POST - CREATE NEW COURT BOOKING
// ============================================================
// 1. Authenticate the user.
// 2. Validate booking details.
// 3. Call MySQL stored procedure.
// 4. Return the booking ID for payment.
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in.",
        },
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

    // Validate the booking inputs.
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
      // Create booking through MySQL stored procedure.
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

      // Retrieve generated booking ID.
      const [result] =
        await connection.query<RowDataPacket[]>(
          "SELECT @new_booking_id AS booking_id"
        );

      const bookingId = Number(
        result[0]?.booking_id
      );

      if (
        !Number.isInteger(bookingId) ||
        bookingId <= 0
      ) {
        throw new Error(
          "Booking ID was not returned."
        );
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
    console.error(
      "Booking creation failed:",
      error
    );

    const dbError = error as {
      sqlState?: string;
      sqlMessage?: string;
    };

    if (dbError.sqlState === "45000") {
      return NextResponse.json(
        {
          success: false,
          message:
            dbError.sqlMessage ||
            "Booking rejected.",
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
