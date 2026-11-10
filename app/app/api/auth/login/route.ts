
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import pool from "@/lib/db";
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
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    const [users] = await pool.query<LoginUser[]>(
      `SELECT
         u.user_id,
         u.name,
         u.email,
         a.password_hash
       FROM \`user\` u
       INNER JOIN user_auth a
         ON u.user_id = a.user_id
       WHERE u.email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const user = users[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    const secret = process.env.AUTH_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error("AUTH_SECRET is missing or too short");
    }

    const token = await new SignJWT({
      userId: user.user_id,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode(secret));

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      },
    });

    // Attach cookie directly to the outgoing HTTP response.
    response.cookies.set("playo_session", token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch (error) {
    console.error("Login failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to log in",
      },
      { status: 500 }
    );
  }
}
