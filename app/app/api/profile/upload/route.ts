
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import type { ResultSetHeader } from "mysql2";



const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to upload a profile photo.",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("photo");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Please select an image." },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_PHOTO_SIZE) {
      return NextResponse.json(
        { success: false, message: "Image must be 2 MB or smaller." },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());

    const isJpeg =
      imageBuffer.length >= 3 &&
      imageBuffer[0] === 0xff &&
      imageBuffer[1] === 0xd8 &&
      imageBuffer[2] === 0xff;

    const isPng =
      imageBuffer.length >= 8 &&
      imageBuffer.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
      );

    const isWebp =
      imageBuffer.length >= 12 &&
      imageBuffer.toString("ascii", 0, 4) === "RIFF" &&
      imageBuffer.toString("ascii", 8, 12) === "WEBP";

    const mimeType = isJpeg
      ? "image/jpeg"
      : isPng
        ? "image/png"
        : isWebp
          ? "image/webp"
          : null;

    if (!mimeType) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG and WebP images are supported.",
        },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `update user
       set profile_photo = ?,
           profile_photo_type = ?
       where user_id = ?`,
      [imageBuffer, mimeType, session.userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile photo uploaded successfully.",
    });
  } catch (error) {
    console.error("Profile upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to upload profile photo.",
      },
      { status: 500 }
    );
  }
}
