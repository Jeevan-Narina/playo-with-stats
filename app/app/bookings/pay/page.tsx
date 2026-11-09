
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Booking {
  booking_id: number;
  venue_name: string;
  court_name: string | null;
  booking_date: string;
  booking_time: string;
  duration: number;
  amount: number | string;
  status: string;
}

interface PaymentResult {
  success: boolean;
  message?: string;
  transaction_reference?: string;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const bookingId = Number(searchParams.get("booking_id"));

  const [booking, setBooking] = useState<Booking | null>(null);
  const [method, setMethod] = useState("upi");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [transactionReference, setTransactionReference] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadBooking() {
      if (
        !Number.isInteger(bookingId) ||
        bookingId <= 0
      ) {
        setError("Invalid booking ID.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/bookings", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Could not load booking."
          );
        }

        const found = (result.data as Booking[]).find(
          (item) =>
            Number(item.booking_id) === bookingId
        );

        if (!found) {
          throw new Error("Booking not found.");
        }

        if (active) {
          setBooking(found);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load booking."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBooking();

    return () => {
      active = false;
    };
  }, [bookingId]);

  async function handlePayment() {
    if (
      !booking ||
      processing ||
      booking.status !== "pending"
    ) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/bookings/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          payment_method: method,
        }),
      });

      const result: PaymentResult =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Payment could not be completed."
        );
      }

      setTransactionReference(
        result.transaction_reference || ""
      );

      setBooking((previous) =>
        previous
          ? { ...previous, status: "confirmed" }
          : previous
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Payment failed."
      );
    } finally {
      setProcessing(false);
    }
  }

  const receiptUrl = booking
    ? `/api/bookings/receipt?booking_id=${booking.booking_id}`
    : "";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-lg">
        <Link
          href="/bookings"
          className="text-emerald-400 hover:underline"
        >
          ← My Bookings
        </Link>

        <h1 className="mt-8 text-3xl font-bold">
          Booking Payment
        </h1>

        {loading ? (
          <p className="mt-8 text-slate-400">
            Loading booking...
          </p>
        ) : (
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
            {booking && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-emerald-400">
                  Booking Summary
                </h2>

                <p>
                  Booking ID: #{booking.booking_id}
                </p>

                <p className="capitalize">
                  Venue: {booking.venue_name}
                </p>

                <p>
                  Court:{" "}
                  {booking.court_name || "Not assigned"}
                </p>

                <p>
                  Date:{" "}
                  {new Date(
                    booking.booking_date
                  ).toLocaleDateString("en-IN", {
                    timeZone: "UTC",
                  })}
                </p>

                <p>
                  Time: {booking.booking_time}
                </p>

                <p>
                  Duration:{" "}
                  {Number(booking.duration) / 60} hours
                </p>

                <div className="border-t border-slate-700 pt-4">
                  <p className="text-2xl font-bold text-emerald-400">
                    ₹
                    {Number(
                      booking.amount
                    ).toFixed(2)}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Simulated payment — no real money
                    will be charged.
                  </p>
                </div>

                {booking.status === "confirmed" ? (
                  <div className="mt-5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-5">
                    <h3 className="text-xl font-bold text-emerald-400">
                      Payment Successful!
                    </h3>

                    <p className="mt-2 text-sm">
                      Your court booking is confirmed.
                    </p>

                    {transactionReference && (
                      <p className="mt-3 break-all text-xs text-slate-300">
                        Transaction:{" "}
                        {transactionReference}
                      </p>
                    )}

                    <a
                      href={receiptUrl}
                      className="mt-5 block rounded-lg bg-emerald-500 px-4 py-3 text-center font-bold text-slate-950 hover:bg-emerald-400"
                    >
                      Download PDF Receipt
                    </a>

                    <Link
                      href="/bookings"
                      className="mt-4 block text-center font-semibold text-emerald-400 hover:underline"
                    >
                      View My Bookings
                    </Link>
                  </div>
                ) : booking.status === "pending" ? (
                  <div className="mt-6 space-y-4">
                    <label
                      htmlFor="payment-method"
                      className="block text-sm font-semibold"
                    >
                      Payment Method
                    </label>

                    <select
                      id="payment-method"
                      value={method}
                      onChange={(e) =>
                        setMethod(e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
                    >
                      <option value="upi">
                        UPI (Simulated)
                      </option>
                      <option value="card">
                        Card (Simulated)
                      </option>
                      <option value="netbanking">
                        Net Banking (Simulated)
                      </option>
                      <option value="wallet">
                        Wallet (Simulated)
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={handlePayment}
                      disabled={processing}
                      className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {processing
                        ? "Processing..."
                        : `Confirm Simulated Payment — ₹${Number(
                            booking.amount
                          ).toFixed(2)}`}
                    </button>
                  </div>
                ) : (
                  <p className="mt-5 text-amber-400">
                    Booking status: {booking.status}
                  </p>
                )}
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="mt-4 text-sm text-red-400"
              >
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-10 text-white">
          Loading payment page...
        </main>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
