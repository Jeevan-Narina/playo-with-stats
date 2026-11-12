
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

// ============================================================
// PLAYO WITH STATS - GLOBAL HOST DASHBOARD API
// ============================================================
// Purpose:
// 1. Verify the logged-in account.
// 2. Allow only authorized Host accounts.
// 3. Retrieve ALL venues in the database.
// 4. Retrieve ALL courts across every venue.
// 5. Retrieve ALL user bookings across every venue.
// 6. Include customer names and emails.
// 7. Preserve booking dates without timezone conversion.
// 8. Return data for the Host Dashboard timeline.
//
// IMPORTANT:
// All accounts with role = "host" have global booking access.
// Do not grant this role to untrusted users.
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
// GET - GLOBAL HOST BOOKINGS
// ============================================================

export async function GET() {
  try {
    // ========================================================
    // STEP 1: AUTHENTICATE THE USER
    // ========================================================

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

    // ========================================================
    // STEP 2: VERIFY HOST ROLE
    // ========================================================
    // Ordinary users must not access all customer bookings.

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

    // ========================================================
    // STEP 3: RETRIEVE ALL VENUES
    // ========================================================
    // No host_user_id filter.
    // Hosts can view every venue in the system.

    const [venues] = await pool.query<VenueRow[]>(
      `SELECT
         venue_id,
         name AS venue_name
       FROM venue
       ORDER BY name, venue_id`
    );

    // ========================================================
    // STEP 4: RETRIEVE ALL COURTS
    // ========================================================
    // Includes courts belonging to every venue.

    const [courts] = await pool.query<CourtRow[]>(
      `SELECT
         vc.court_id,
         vc.venue_id,
         vc.court_name
       FROM venue_court vc
       INNER JOIN venue v
         ON vc.venue_id = v.venue_id
       ORDER BY
         v.name,
         vc.court_id`
    );

    // ========================================================
    // STEP 5: RETRIEVE ALL USER BOOKINGS
    // ========================================================
    // Includes:
    // - All venues
    // - All courts
    // - All customers
    // - Confirmed bookings
    // - Pending bookings
    // - Expired bookings
    // - Cancelled bookings
    //
    // DATE_FORMAT prevents JavaScript timezone shifts.
    // ========================================================

    const [bookings] =
      await pool.query<BookingRow[]>(
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

         ORDER BY
           b.booking_date DESC,
           b.booking_time DESC,
           b.booking_id DESC`
      );

    // ========================================================
    // STEP 6: RETURN GLOBAL DASHBOARD DATA
    // ========================================================
    // Response structure is unchanged, so the existing
    // Host Dashboard frontend can use this API.
    // ========================================================

    return NextResponse.json({
      success: true,
      venues,
      courts,
      bookings,
    });
  } catch (error) {
    // ========================================================
    // ERROR HANDLING
    // ========================================================

    console.error(
      "Global Host bookings API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load host bookings.",
      },
      { status: 500 }
    );
  }
}
