
"use client";

import { useEffect, useState } from "react";
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

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      try {
        const response = await fetch("/api/bookings", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load bookings."
          );
        }

        if (active) {
          setBookings(result.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load bookings."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      active = false;
    };
  }, []);

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-IN", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-emerald-400">
            Playo <span className="text-white">with Stats</span>
          </h1>

          <Link
            href="/dashboard"
            className="text-sm text-slate-300 hover:text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">
              My Personal Bookings
            </h2>

            <p className="mt-3 text-slate-400">
              View your court reservations, payments,
              and booking receipts.
            </p>
          </div>

          <Link
            href="/bookings/new"
            className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            + Book a Court
          </Link>
        </div>

        {loading && (
          <p className="mt-8 text-slate-400">
            Loading your bookings...
          </p>
        )}

        {error && (
          <p role="alert" className="mt-8 text-red-400">
            {error}
          </p>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h3 className="text-xl font-semibold">
              No personal bookings yet
            </h3>

            <p className="mt-3 text-slate-400">
              Reserve a court to see your bookings here.
            </p>

            <Link
              href="/bookings/new"
              className="mt-5 inline-block font-semibold text-emerald-400 hover:underline"
            >
              Book Your First Court
            </Link>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {bookings.map((booking) => {
                const confirmed =
                  booking.status === "confirmed";

                const pending =
                  booking.status === "pending";

                return (
                  <div
                    key={booking.booking_id}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-6"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-bold capitalize">
                        {booking.venue_name}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          confirmed
                            ? "bg-emerald-500/10 text-emerald-400"
                            : pending
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-300">
                      <p>
                        Booking ID: #{booking.booking_id}
                      </p>

                      <p>
                        Court:{" "}
                        {booking.court_name ||
                          "Not assigned"}
                      </p>

                      <p>
                        Date:{" "}
                        {formatDate(booking.booking_date)}
                      </p>

                      <p>
                        Start Time: {booking.booking_time}
                      </p>

                      <p>
                        Duration:{" "}
                        {Number(booking.duration) / 60} hours
                      </p>
                    </div>

                    <p className="mt-5 text-xl font-bold text-emerald-400">
                      ₹{Number(booking.amount).toFixed(2)}
                    </p>

                    {confirmed && (
                      <a
                        href={`/api/bookings/receipt?booking_id=${booking.booking_id}`}
                        className="mt-5 block rounded-lg bg-emerald-500 px-4 py-3 text-center font-semibold text-slate-950 hover:bg-emerald-400"
                      >
                        Download PDF Receipt
                      </a>
                    )}

                    {pending && (
                      <Link
                        href={`/bookings/pay?booking_id=${booking.booking_id}`}
                        className="mt-5 block rounded-lg border border-amber-500 px-4 py-3 text-center font-semibold text-amber-400 hover:bg-amber-500/10"
                      >
                        Complete Payment
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Total bookings: {bookings.length}
            </p>
          </>
        )}
      </section>
    </main>
  );
}
