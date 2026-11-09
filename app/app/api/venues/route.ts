import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      "select venue_id, name, address, type, price from venue order by venue_id"
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Failed to fetch venues:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch venues" },
      { status: 500 }
    );
  }
}
