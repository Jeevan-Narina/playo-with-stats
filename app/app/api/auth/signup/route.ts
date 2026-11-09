
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import type { ResultSetHeader } from "mysql2";

export async function POST(request: NextRequest) {
  let conn;

  try {
    const body = await request.json();

    const { name, email, password } = body;

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid name, email, and password (minimum 8 characters, maximum 72 bytes).",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [result] = await conn.query<ResultSetHeader>(
      "insert into user (name, email) values (?, ?)",
      [name.trim(), email.trim().toLowerCase()]
    );

    await conn.query(
      "insert into user_auth (user_id, password_hash) values (?, ?)",
      [result.insertId, passwordHash]
    );

    await conn.commit();

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (conn) {
      await conn.rollback();
    }

    const dbError = error as { code?: string };

    if (dbError.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 409 }
      );
    }

    console.error("Sign up failed:", error);

    return NextResponse.json(
      { success: false, message: "Could not create account" },
      { status: 500 }
    );
  } finally {
    conn?.release();
  }
}
