
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { createSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

interface LoginUser extends RowDataPacket {
  user_id: number;
  name: string;
  email: string;
  password_hash: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const [users] = await pool.query<LoginUser[]>(
      `select u.user_id, u.name, u.email, a.password_hash
       from user u
       join user_auth a on u.user_id = a.user_id
       where u.email = ?
       limit 1`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = users[0];
    const passwordValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    await createSession(user.user_id);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to log in" },
      { status: 500 }
    );
  }
}
