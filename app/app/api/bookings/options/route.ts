
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface VenueRow extends RowDataPacket {
  venue_id: number;
  name: string;
  type: string;
  price: number;
}

interface CourtRow extends RowDataPacket {
  court_id: number;
  venue_id: number;
  court_name: string;
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in first.",
        },
        { status: 401 }
      );
    }

    const [venues] = await pool.query<VenueRow[]>(
      `SELECT venue_id, name, type, price
       FROM venue
       ORDER BY type, name`
    );

    const [courts] = await pool.query<CourtRow[]>(
      `SELECT court_id, venue_id, court_name
       FROM venue_court
       WHERE is_active = TRUE
       ORDER BY venue_id, court_name`
    );

    const sports = [
      ...new Set(
        venues.map((venue) => venue.type)
      ),
    ];

    return NextResponse.json({
      success: true,
      sports,
      venues,
      courts,
    });
  } catch (error) {
    console.error("Booking options error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load booking options.",
      },
      { status: 500 }
    );
  }
}
