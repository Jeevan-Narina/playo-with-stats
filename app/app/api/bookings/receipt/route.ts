
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";

interface ReceiptRow extends RowDataPacket {
  booking_id: number;
  customer_name: string;
  venue_name: string;
  court_name: string | null;
  booking_date: string;
  booking_time: string;
  duration: number;
  amount: string;
  payment_method: string;
  payment_status: string;
  transaction_reference: string;
  payment_date: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    const bookingId = Number(
      request.nextUrl.searchParams.get("booking_id")
    );

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID." },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<ReceiptRow[]>(
      `SELECT
         b.booking_id,
         u.name AS customer_name,
         v.name AS venue_name,
         vc.court_name,
         DATE_FORMAT(b.booking_date, '%d-%m-%Y')
           AS booking_date,
         TIME_FORMAT(b.booking_time, '%H:%i')
           AS booking_time,
         b.duration,
         p.amount,
         p.payment_method,
         p.payment_status,
         p.transaction_reference,
         DATE_FORMAT(p.payment_date, '%d-%m-%Y %H:%i')
           AS payment_date
       FROM booking b
       JOIN \`user\` u
         ON b.user_id = u.user_id
       JOIN venue v
         ON b.venue_id = v.venue_id
       LEFT JOIN venue_court vc
         ON b.court_id = vc.court_id
       JOIN payment p
         ON b.booking_id = p.booking_id
       WHERE b.booking_id = ?
         AND b.user_id = ?
         AND p.payment_status = 'success'
       ORDER BY p.payment_date DESC, p.payment_id DESC
       LIMIT 1`,
      [bookingId, session.userId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No successful payment receipt found for this booking.",
        },
        { status: 404 }
      );
    }

    const receipt = rows[0];

    const pdf = await PDFDocument.create();

    const page = pdf.addPage([595, 842]);

    const font = await pdf.embedFont(
      StandardFonts.Helvetica
    );

    const boldFont = await pdf.embedFont(
      StandardFonts.HelveticaBold
    );

    const green = rgb(0.05, 0.55, 0.35);
    const black = rgb(0.12, 0.16, 0.22);
    const grey = rgb(0.42, 0.46, 0.52);

    page.drawText("PLAYO WITH STATS", {
      x: 50,
      y: 780,
      size: 24,
      font: boldFont,
      color: green,
    });

    page.drawText("PERSONAL BOOKING RECEIPT", {
      x: 50,
      y: 748,
      size: 15,
      font: boldFont,
      color: black,
    });

    page.drawLine({
      start: { x: 50, y: 728 },
      end: { x: 545, y: 728 },
      thickness: 1,
      color: grey,
    });

    let y = 695;

    function detail(label: string, value: string) {
      page.drawText(label, {
        x: 50,
        y,
        size: 11,
        font: boldFont,
        color: black,
      });

      page.drawText(
        value.replace(/[^\x20-\x7E]/g, "?"),
        {
          x: 230,
          y,
          size: 11,
          font,
          color: black,
          maxWidth: 315,
        }
      );

      y -= 35;
    }

    detail("Booking ID", `#${receipt.booking_id}`);
    detail("Customer", receipt.customer_name);
    detail("Venue", receipt.venue_name);
    detail("Court", receipt.court_name || "Not assigned");
    detail("Booking Date", receipt.booking_date);
    detail("Start Time", receipt.booking_time);
    detail(
      "Duration",
      `${Number(receipt.duration) / 60} hours`
    );
    detail("Payment Method", receipt.payment_method.toUpperCase());
    detail("Payment Status", "SUCCESS");
    detail("Payment Date", receipt.payment_date);

    page.drawLine({
      start: { x: 50, y: y + 8 },
      end: { x: 545, y: y + 8 },
      thickness: 1,
      color: grey,
    });

    y -= 20;

    page.drawText(
      `TOTAL PAID: INR ${Number(receipt.amount).toFixed(2)}`,
      {
        x: 50,
        y,
        size: 17,
        font: boldFont,
        color: green,
      }
    );

    y -= 45;

    page.drawText("Transaction Reference:", {
      x: 50,
      y,
      size: 10,
      font: boldFont,
      color: black,
    });

    y -= 20;

    page.drawText(receipt.transaction_reference, {
      x: 50,
      y,
      size: 9,
      font,
      color: grey,
      maxWidth: 490,
    });

    page.drawLine({
      start: { x: 50, y: 135 },
      end: { x: 545, y: 135 },
      thickness: 1,
      color: grey,
    });

    page.drawText(
      "Simulated payment receipt - No real money was transferred.",
      {
        x: 50,
        y: 110,
        size: 10,
        font,
        color: grey,
      }
    );

    page.drawText(
      "Generated by Playo with Stats",
      {
        x: 50,
        y: 90,
        size: 10,
        font,
        color: grey,
      }
    );

    const pdfBytes = await pdf.save();

    return new Response(new Uint8Array(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="booking-receipt-${bookingId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Receipt generation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate receipt.",
      },
      { status: 500 }
    );
  }
}
