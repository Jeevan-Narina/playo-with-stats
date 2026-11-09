import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export async function GET() {
  try {
    const redis = await getRedis();
    const response = await redis.ping();

    return NextResponse.json({
      success: true,
      message: "Redis connected successfully",
      response,
    });
  } catch (error) {
    console.error("Redis test failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Redis connection failed",
      },
      { status: 500 }
    );
  }
}
