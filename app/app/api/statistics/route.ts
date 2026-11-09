
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

interface MatchRow extends RowDataPacket {
  match_id: number;
  event_title: string;
  match_date: string;
  status: string;
  team1_id: number;
  team2_id: number;
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    // Only show completed matches organized by this user.
    const [matches] = await pool.query<MatchRow[]>(
      `SELECT
         m.match_id,
         e.event_title,
         DATE_FORMAT(m.match_date, '%Y-%m-%d') AS match_date,
         m.status,
         m.team1_id,
         m.team2_id
       FROM \`match\` m
       JOIN event e ON m.event_id = e.event_id
       WHERE e.created_by_user_id = ?
         AND m.status = 'completed'
       ORDER BY m.match_date DESC`,
      [session.userId]
    );

    // Retrieve participating players for these matches.
    const [players] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT
         m.match_id,
         u.user_id,
         u.name
       FROM \`match\` m
       JOIN event e ON m.event_id = e.event_id
       JOIN team_member tm
         ON tm.team_id IN (m.team1_id, m.team2_id)
       JOIN \`user\` u ON tm.user_id = u.user_id
       WHERE e.created_by_user_id = ?
         AND m.status = 'completed'
       ORDER BY m.match_id, u.name`,
      [session.userId]
    );

    const [statTypes] = await pool.query<RowDataPacket[]>(
      `SELECT type_id, name
       FROM stat_type
       ORDER BY name`
    );

    return NextResponse.json({
      success: true,
      matches,
      players,
      stat_types: statTypes,
    });
  } catch (error) {
    console.error("Statistics retrieval error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load statistics options.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { match_id, user_id, type_id, value } = body;

    if (
      !Number.isInteger(match_id) ||
      match_id <= 0 ||
      !Number.isInteger(user_id) ||
      user_id <= 0 ||
      !Number.isInteger(type_id) ||
      type_id <= 0 ||
      !Number.isInteger(value) ||
      value < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid statistics details.",
        },
        { status: 400 }
      );
    }

    // Verify organizer ownership and player membership.
    const [eligible] = await pool.query<RowDataPacket[]>(
      `SELECT m.match_id
       FROM \`match\` m
       JOIN event e ON m.event_id = e.event_id
       WHERE m.match_id = ?
         AND m.status = 'completed'
         AND e.created_by_user_id = ?
         AND EXISTS (
           SELECT 1
           FROM team_member tm
           WHERE tm.user_id = ?
             AND tm.team_id IN (m.team1_id, m.team2_id)
         )`,
      [match_id, session.userId, user_id]
    );

    if (eligible.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only the organizer can record statistics for a participating player in a completed match.",
        },
        { status: 403 }
      );
    }

    const [statTypes] = await pool.query<RowDataPacket[]>(
      "SELECT type_id FROM stat_type WHERE type_id = ?",
      [type_id]
    );

    if (statTypes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid statistic type.",
        },
        { status: 400 }
      );
    }

    // Update an existing stat instead of creating duplicates.
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT stat_id
       FROM player_stat
       WHERE match_id = ?
         AND user_id = ?
         AND type_id = ?
       LIMIT 1`,
      [match_id, user_id, type_id]
    );

    if (existing.length > 0) {
      await pool.query<ResultSetHeader>(
        `UPDATE player_stat
         SET value = ?
         WHERE stat_id = ?`,
        [value, existing[0].stat_id]
      );

      return NextResponse.json({
        success: true,
        message: "Player statistic updated.",
        stat_id: existing[0].stat_id,
      });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO player_stat
         (match_id, user_id, type_id, value)
       VALUES (?, ?, ?, ?)`,
      [match_id, user_id, type_id, value]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Player statistic recorded.",
        stat_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Statistics recording error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to record player statistics.",
      },
      { status: 500 }
    );
  }
}
