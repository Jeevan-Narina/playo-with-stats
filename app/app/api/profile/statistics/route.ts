
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

interface PlayerStatistic extends RowDataPacket {
  stat_id: number;
  sport_type: string;
  event_title: string;
  match_date: string;
  statistic: string;
  value: number;
}

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

    // Only return statistics for the logged-in user.
    // Works for hosts and ordinary sports members.
    const [statistics] = await pool.query<PlayerStatistic[]>(
      `SELECT
         ps.stat_id,
         e.sport_type,
         e.event_title,
         DATE_FORMAT(m.match_date, '%Y-%m-%d') AS match_date,
         st.name AS statistic,
         ps.value
       FROM player_stat ps
       INNER JOIN stat_type st
         ON ps.type_id = st.type_id
       INNER JOIN \`match\` m
         ON ps.match_id = m.match_id
       INNER JOIN event e
         ON m.event_id = e.event_id
       WHERE ps.user_id = ?
       ORDER BY
         e.sport_type,
         m.match_date DESC,
         e.event_title,
         st.name`,
      [session.userId]
    );

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error("Profile statistics error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load sports statistics.",
      },
      { status: 500 }
    );
  }
}
