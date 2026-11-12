
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Venue {
  venue_id: number;
  venue_name: string;
}

interface Court {
  court_id: number;
  venue_id: number;
  court_name: string;
}

interface Booking {
  booking_id: number;
  booking_date: string;
  booking_time: string;
  duration: number;
  amount: string;
  status: string;
  venue_id: number;
  court_id: number | null;
  venue_name: string;
  court_name: string | null;
  customer_name: string | null;
  customer_email: string | null;
}

interface HostData {
  success: boolean;
  message?: string;
  venues?: Venue[];
  courts?: Court[];
  bookings?: Booking[];
}

interface TimeSlot {
  start: number;
  end: number;
  booked: boolean;
  booking: Booking | null;
}

const SLOT_MINUTES = 30;
const SLOTS_PER_DAY = 48;

// Calculate the current date only in the browser.
function getToday(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(mins).padStart(2, "0")
  );
}

function formatMoney(amount: number): string {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });
}

export default function HostDashboard() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [venueId, setVenueId] = useState<number>(0);
  const [courtId, setCourtId] = useState<number>(0);

  // Fixed: No new Date() during prerendering.
  const [date, setDate] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/host/bookings", {
        credentials: "same-origin",
        cache: "no-store",
      });

      const data: HostData = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to load bookings.");
        return;
      }

      const nextVenues = data.venues || [];
      const nextCourts = data.courts || [];

      setVenues(nextVenues);
      setCourts(nextCourts);
      setBookings(data.bookings || []);

      setVenueId((current) =>
        nextVenues.some(
          (venue) => venue.venue_id === current
        )
          ? current
          : nextVenues[0]?.venue_id || 0
      );
    } catch (err) {
      console.error("Host dashboard error:", err);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  // Runs after the component mounts in the browser.
  useEffect(() => {
    setDate(getToday());
    void loadData();
  }, []);

  const venueCourts = useMemo(
    () =>
      courts.filter(
        (court) => court.venue_id === venueId
      ),
    [courts, venueId]
  );

  useEffect(() => {
    setCourtId((current) =>
      venueCourts.some(
        (court) => court.court_id === current
      )
        ? current
        : venueCourts[0]?.court_id || 0
    );
  }, [venueCourts]);

  const dayBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.venue_id === venueId &&
          booking.booking_date === date
      ),
    [bookings, venueId, date]
  );

  const courtBookings = useMemo(
    () =>
      dayBookings.filter(
        (booking) => booking.court_id === courtId
      ),
    [dayBookings, courtId]
  );

  // Generate one continuous 24-hour availability timeline.
  const slots = useMemo<TimeSlot[]>(() => {
    return Array.from(
      { length: SLOTS_PER_DAY },
      (_, index) => {
        const start = index * SLOT_MINUTES;
        const end = start + SLOT_MINUTES;

        const booking = courtBookings.find((item) => {
          if (
            item.status !== "confirmed" &&
            item.status !== "pending"
          ) {
            return false;
          }

          const bookingStart = timeToMinutes(
            item.booking_time
          );

          const bookingEnd =
            bookingStart + Number(item.duration);

          return bookingStart < end && bookingEnd > start;
        });

        return {
          start,
          end,
          booking: booking || null,
          booked: Boolean(booking),
        };
      }
    );
  }, [courtBookings]);

  const bookedSlots = slots.filter(
    (slot) => slot.booked
  ).length;

  const confirmedBookings = courtBookings.filter(
    (booking) => booking.status === "confirmed"
  );

  const confirmedValue = confirmedBookings.reduce(
    (total, booking) =>
      total + Number(booking.amount),
    0
  );

  const venueName =
    venues.find(
      (venue) => venue.venue_id === venueId
    )?.venue_name || "";

  const courtName =
    courts.find(
      (court) => court.court_id === courtId
    )?.court_name || "";

  const legacyBookings = dayBookings.filter(
    (booking) => booking.court_id === null
  );

  return (
    <main className="min-h-screen bg-[#020617] p-6 text-white">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Host Dashboard
            </h1>

            <p className="mt-2 text-gray-400">
              View bookings and 24-hour court availability.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>

            <Link
              href="/profile"
              className="text-emerald-400 hover:underline"
            >
              My Profile
            </Link>
          </div>
        </header>

        {loading && (
          <p className="text-gray-400">
            Loading bookings...
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-red-600 bg-red-950 p-4">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            {/* VENUE, COURT AND DATE FILTERS */}
            <section className="mb-6 rounded-xl border border-slate-700 bg-slate-900 p-5">
              <h2 className="mb-4 text-lg font-semibold">
                My Venue Schedule
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                <label className="block">
                  <span className="mb-2 block text-sm">
                    Venue
                  </span>

                  <select
                    value={venueId}
                    onChange={(event) =>
                      setVenueId(
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3"
                  >
                    {venues.length === 0 && (
                      <option value={0}>
                        No venues assigned
                      </option>
                    )}

                    {venues.map((venue) => (
                      <option
                        key={venue.venue_id}
                        value={venue.venue_id}
                      >
                        {venue.venue_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm">
                    Court
                  </span>

                  <select
                    value={courtId}
                    onChange={(event) =>
                      setCourtId(
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3"
                  >
                    {venueCourts.length === 0 && (
                      <option value={0}>
                        No courts available
                      </option>
                    )}

                    {venueCourts.map((court) => (
                      <option
                        key={court.court_id}
                        value={court.court_id}
                      >
                        {court.court_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm">
                    Date
                  </span>

                  <input
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3"
                  />
                </label>

              </div>
            </section>

            {/* AVAILABILITY TIMELINE */}
            <section className="mb-6 rounded-xl border border-slate-700 bg-slate-900 p-6">

              <h2 className="text-xl font-bold capitalize">
                {venueName || "My Venue"}
              </h2>

              <p className="mb-6 mt-1 text-gray-400">
                {courtName || "No court selected"}
                {date ? ` • ${date}` : ""}
              </p>

              <h3 className="mb-4 font-semibold">
                24-Hour Availability
              </h3>

              {courtId === 0 ? (
                <p className="text-gray-400">
                  No court available for this venue.
                </p>
              ) : (
                <div className="overflow-x-auto pb-3">
                  <div className="min-w-[720px]">

                    {/* SINGLE CONTINUOUS TIMELINE BAR */}
                    <div
                      className="flex h-14 w-full overflow-hidden rounded-lg border border-slate-600"
                      role="img"
                      aria-label="24-hour court timeline: red indicates booked time and green indicates available time"
                    >
                      {slots.map((slot) => (
                        <div
                          key={slot.start}
                          title={
                            slot.booking
                              ? `${formatTime(slot.start)}–${formatTime(slot.end)}: Booking #${slot.booking.booking_id}, ${slot.booking.status}`
                              : `${formatTime(slot.start)}–${formatTime(slot.end)}: Available`
                          }
                          className={
                            "h-full min-w-0 flex-1 " +
                            (slot.booked
                              ? "bg-red-600 hover:bg-red-500"
                              : "bg-green-600 hover:bg-green-500")
                          }
                        />
                      ))}
                    </div>

                    {/* 24-HOUR TIME LABELS */}
                    <div className="relative mt-2 h-9">
                      {Array.from(
                        { length: 13 },
                        (_, index) => {
                          const hour = index * 2;

                          return (
                            <span
                              key={hour}
                              className="absolute text-xs text-gray-400 tabular-nums"
                              style={{
                                left: `${(hour / 24) * 100}%`,
                                transform:
                                  hour === 0
                                    ? "none"
                                    : hour === 24
                                    ? "translateX(-100%)"
                                    : "translateX(-50%)",
                              }}
                            >
                              {formatTime(hour * 60)}
                            </span>
                          );
                        }
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* LEGEND */}
              <div className="mt-3 flex flex-wrap gap-6 text-sm">

                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-sm bg-green-600" />
                  Available
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-sm bg-red-600" />
                  Booked
                </div>

              </div>

              {/* STATISTICS */}
              <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">

                <div className="rounded-lg bg-slate-800 p-4">
                  <p className="text-sm text-gray-400">
                    Available
                  </p>

                  <p className="text-xl font-bold text-green-400">
                    {courtId ? (48 - bookedSlots) / 2 : 0} hrs
                  </p>
                </div>

                <div className="rounded-lg bg-slate-800 p-4">
                  <p className="text-sm text-gray-400">
                    Booked
                  </p>

                  <p className="text-xl font-bold text-red-400">
                    {bookedSlots / 2} hrs
                  </p>
                </div>

                <div className="rounded-lg bg-slate-800 p-4">
                  <p className="text-sm text-gray-400">
                    Confirmed
                  </p>

                  <p className="text-xl font-bold">
                    {confirmedBookings.length}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-800 p-4">
                  <p className="text-sm text-gray-400">
                    Booking Value
                  </p>

                  <p className="text-xl font-bold text-emerald-400">
                    {formatMoney(confirmedValue)}
                  </p>
                </div>

              </div>

              <p className="mt-4 text-xs text-gray-400">
                Hover over the bar to see booking details.
                Pending and confirmed bookings appear red.
                This represents reservation occupancy, not
                venue opening hours. Overnight bookings from
                the previous date are not yet included.
              </p>

              {legacyBookings.length > 0 && (
                <p className="mt-4 text-sm text-amber-300">
                  {legacyBookings.length} older booking(s)
                  have no assigned court. They appear in the
                  table below but cannot be positioned on
                  a specific court timeline.
                </p>
              )}
            </section>

            {/* BOOKING DETAILS */}
            <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">

              <div className="p-5">
                <h2 className="text-xl font-bold">
                  Bookings for {date || "Selected Date"}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">

                  <thead className="bg-slate-800 text-gray-300">
                    <tr>
                      <th className="p-4">Booking</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Court</th>
                      <th className="p-4">Time</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dayBookings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-6 text-center text-gray-400"
                        >
                          No bookings for this date.
                        </td>
                      </tr>
                    ) : (
                      dayBookings.map((booking) => (
                        <tr
                          key={booking.booking_id}
                          className="border-t border-slate-700"
                        >
                          <td className="p-4">
                            #{booking.booking_id}
                          </td>

                          <td className="p-4">
                            {booking.customer_name ||
                              "Not recorded"}

                            {booking.customer_email && (
                              <p className="text-xs text-gray-400">
                                {booking.customer_email}
                              </p>
                            )}
                          </td>

                          <td className="p-4">
                            {booking.court_name ||
                              "Not assigned"}
                          </td>

                          <td className="p-4">
                            {booking.booking_time.slice(0, 5)}
                          </td>

                          <td className="p-4">
                            {booking.duration} min
                          </td>

                          <td className="p-4">
                            {formatMoney(
                              Number(booking.amount)
                            )}
                          </td>

                          <td className="p-4">
                            {booking.status}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
