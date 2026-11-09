
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";



interface PhotoRow extends RowDataPacket {
  profile_photo: Buffer | null;
  profile_photo_type: string | null;
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { message: "Please log in first." },
        { status: 401 }
      );
    }

    const [rows] = await pool.query<PhotoRow[]>(
      `select profile_photo, profile_photo_type
       from user
       where user_id = ?`,
      [session.userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    const photo = rows[0].profile_photo;
    const mimeType = rows[0].profile_photo_type;

    if (!photo || !mimeType) {
      return new NextResponse(null, { status: 204 });
    }

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(mimeType)
    ) {
      return NextResponse.json(
        { message: "Unsupported image format." },
        { status: 415 }
      );
    }

    return new NextResponse(new Uint8Array(photo), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Photo retrieval error:", error);

    return NextResponse.json(
      { message: "Unable to retrieve profile photo." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const [result] = await pool.query(
      `update user
       set profile_photo = null,
           profile_photo_type = null
       where user_id = ?`,
      [session.userId]
    );

    return NextResponse.json({
      success: true,
      message: "Profile picture removed successfully.",
    });
  } catch (error) {
    console.error("Remove profile picture error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to remove profile picture.",
      },
      { status: 500 }
    );
  }
}

