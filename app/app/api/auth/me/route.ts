
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  has_photo: number;
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    const [users] = await pool.query<UserRow[]>(
      `select
         user_id,
         name,
         email,
         (profile_photo is not null) as has_photo
       from user
       where user_id = ?`,
      [session.userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: users[0],
    });
  } catch (error) {
    console.error("User session error:", error);

    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 }
    );
  }
}
