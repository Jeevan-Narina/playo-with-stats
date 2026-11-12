
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

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

export async function GET() {
  try {
    // 1. Identify the logged-in account.
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

    // 2. Verify that this account is a host.
    const [users] = await pool.query<HostRow[]>(
      "SELECT role FROM `user` WHERE user_id = ?",
      [session.userId]
    );

    if (users.length === 0 || users[0].role !== "host") {
      return NextResponse.json(
        {
          success: false,
          message: "Host access only.",
        },
        { status: 403 }
      );
    }

    // 3. Retrieve only venues owned by this host.
    const [venues] = await pool.query<VenueRow[]>(
      `SELECT
         venue_id,
         name AS venue_name
       FROM venue
       WHERE host_user_id = ?
       ORDER BY name`,
      [session.userId]
    );

    // 4. Retrieve courts belonging to those venues.
    const [courts] = await pool.query<CourtRow[]>(
      `SELECT
         vc.court_id,
         vc.venue_id,
         vc.court_name
       FROM venue_court vc
       INNER JOIN venue v
         ON vc.venue_id = v.venue_id
       WHERE v.host_user_id = ?
       ORDER BY vc.venue_id, vc.court_id`,
      [session.userId]
    );

    // 5. Retrieve bookings for this host's venues.
    const [bookings] = await pool.query<BookingRow[]>(
      `SELECT
         b.booking_id,
         DATE_FORMAT(
           b.booking_date, '%Y-%m-%d'
         ) AS booking_date,
         b.booking_time,
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

    // 6. Return all data needed by both pages.
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
