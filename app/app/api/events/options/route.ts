
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
}

interface VenueRow extends RowDataPacket {
  venue_id: number;
  name: string;
  type: string;
}

export async function GET() {
  try {
    const [users] = await pool.query<UserRow[]>(
      `select user_id, name
       from user
       order by name`
    );

    const [venues] = await pool.query<VenueRow[]>(
      `select venue_id, name, type
       from venue
       order by name`
    );

    const [sports] = await pool.query<RowDataPacket[]>(
      `select distinct type as sport_type
       from venue
       where type is not null
         and trim(type) <> ''
       order by type`
    );

    return NextResponse.json({
      success: true,
      users,
      venues,
      sports: sports.map((row) => row.sport_type),
    });
  } catch (error) {
    console.error("Failed to load event options:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Could not load organizers, sports and venues.",
      },
      { status: 500 }
    );
  }
}
