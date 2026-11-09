
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { randomUUID } from "node:crypto";

interface BookingRow extends RowDataPacket {
  booking_id: number;
  user_id: number;
  amount: string;
  status: string;
  expired: number;
}

const allowedMethods = [
  "upi",
  "card",
  "netbanking",
  "wallet",
];

export async function POST(request: Request) {
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

  let connection;

  try {
    const body = await request.json();

    const bookingId = body.booking_id;
    const paymentMethod = body.payment_method;

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0 ||
      typeof paymentMethod !== "string" ||
      !allowedMethods.includes(paymentMethod)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment details.",
        },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [bookings] = await connection.query<BookingRow[]>(
      `SELECT
         booking_id,
         user_id,
         amount,
         status,
         CASE
           WHEN created_at <= NOW() - INTERVAL 15 MINUTE
           THEN 1
           ELSE 0
         END AS expired
       FROM booking
       WHERE booking_id = ?
       FOR UPDATE`,
      [bookingId]
    );

    if (bookings.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        {
          success: false,
          message: "Booking not found.",
        },
        { status: 404 }
      );
    }

    const booking = bookings[0];

    if (Number(booking.user_id) !== session.userId) {
      await connection.rollback();

      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 }
      );
    }

    if (booking.status !== "pending") {
      await connection.rollback();

      return NextResponse.json(
        {
          success: false,
          message:
            booking.status === "expired"
              ? "Payment deadline expired. Please create a new booking."
              : "This booking is not awaiting payment.",
        },
        { status: 409 }
      );
    }

    if (Number(booking.expired) === 1) {
      await connection.query(
        `UPDATE booking
         SET status = 'expired'
         WHERE booking_id = ?`,
        [bookingId]
      );

      await connection.commit();

      return NextResponse.json(
        {
          success: false,
          message:
            "Your 15-minute payment window has expired. Please create a new booking.",
        },
        { status: 409 }
      );
    }

    const transactionReference = `SIM-${randomUUID()}`;

    await connection.query(
      `INSERT INTO payment (
         booking_id,
         amount,
         payment_method,
         payment_status,
         transaction_reference
       )
       VALUES (?, ?, ?, 'success', ?)`,
      [
        bookingId,
        booking.amount,
        paymentMethod,
        transactionReference,
      ]
    );

    await connection.query(
      `UPDATE booking
       SET status = 'confirmed'
       WHERE booking_id = ?`,
      [bookingId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Simulated payment successful.",
      booking_id: bookingId,
      amount: booking.amount,
      transaction_reference: transactionReference,
      payment_status: "success",
      receipt_url:
        `/api/bookings/receipt?booking_id=${bookingId}`,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    console.error("Payment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process simulated payment.",
      },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
