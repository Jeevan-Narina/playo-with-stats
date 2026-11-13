
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

// ============================================================
// PLAYO WITH STATS - HOST BOOKINGS API
// ============================================================
// Each host can view only:
// 1. Venues assigned to their account.
// 2. Courts belonging to their assigned venues.
// 3. Bookings belonging to their assigned venues.
//
// The existing API response structure is preserved.
// Booking dates are formatted to prevent timezone shifts.
// ============================================================

// ============================================================
// TYPES
// ============================================================

interface HostRow extends RowDataPacket {
  role: string;
}

interface VenueRow extends RowDataPacket {
  venue_id: number;
  venue_name: string;
}

interface CourtRow extends RowDataPacket {
  court_id: number;
  venue_id: number;
  court_name: string;
}

interface BookingRow extends RowDataPacket {
  booking_id: number;
  booking_date: string;
  booking_time: string;
  duration: number;
  amount: string;
  status: string;
  venue_id: number;
  court_id: number | null;
  venue_name: string;
  court_name: string | null;
  customer_name: string | null;
  customer_email: string | null;
}

// ============================================================
// GET - BOOKINGS FOR THE LOGGED-IN HOST
// ============================================================

export async function GET() {
  try {
    // STEP 1: Authenticate the user.

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

    // STEP 2: Verify that the user is a host.

    const [users] = await pool.query<HostRow[]>(
      `SELECT role
       FROM \`user\`
       WHERE user_id = ?`,
      [session.userId]
    );

    if (
      users.length === 0 ||
      users[0].role !== "host"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Host access only.",
        },
        { status: 403 }
      );
    }

    // STEP 3: Retrieve only this host's venues.

    const [venues] = await pool.query<VenueRow[]>(
      `SELECT
         venue_id,
         name AS venue_name
       FROM venue
       WHERE host_user_id = ?
       ORDER BY name, venue_id`,
      [session.userId]
    );

    // STEP 4: Retrieve courts at this host's venues.

    const [courts] = await pool.query<CourtRow[]>(
      `SELECT
         vc.court_id,
         vc.venue_id,
         vc.court_name
       FROM venue_court vc
       INNER JOIN venue v
         ON vc.venue_id = v.venue_id
       WHERE v.host_user_id = ?
       ORDER BY
         v.name,
         vc.court_id`,
      [session.userId]
    );

    // STEP 5: Retrieve bookings at this host's venues.
    // Keep all statuses and original booking details.
    // DATE_FORMAT prevents timezone-related date shifts.

    const [bookings] = await pool.query<BookingRow[]>(
      `SELECT
         b.booking_id,

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
         b.status,
         b.venue_id,
         b.court_id,

         v.name AS venue_name,
         vc.court_name,

         u.name AS customer_name,
         u.email AS customer_email

       FROM booking b

       INNER JOIN venue v
         ON b.venue_id = v.venue_id

       LEFT JOIN venue_court vc
         ON b.court_id = vc.court_id

       LEFT JOIN \`user\` u
         ON b.user_id = u.user_id

       WHERE v.host_user_id = ?

       ORDER BY
         b.booking_date DESC,
         b.booking_time DESC,
         b.booking_id DESC`,
      [session.userId]
    );

    // STEP 6: Return the existing response structure.

    return NextResponse.json({
      success: true,
      venues,
      courts,
      bookings,
    });
  } catch (error) {
    console.error("Host bookings API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load host bookings.",
      },
      { status: 500 }
    );
  }
}
