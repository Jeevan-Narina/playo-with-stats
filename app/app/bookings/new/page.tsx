
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Venue {
  venue_id: number;
  name: string;
  type: string;
  price: number | string;
}

interface Court {
  court_id: number;
  venue_id: number;
  court_name: string;
}

interface BookingOptions {
  success: boolean;
  sports: string[];
  venues: Venue[];
  courts: Court[];
  message?: string;
}

export default function NewBookingPage() {
  const router = useRouter();

  const [sports, setSports] = useState<string[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [localToday, setLocalToday] = useState("");

  const [form, setForm] = useState({
    sport: "",
    venue_id: "",
    court_id: "",
    booking_date: "",
    booking_time: "",
    duration: "60",
  });

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-emerald-400";

  useEffect(() => {
    // Calculate today's date in the browser, not during prerendering.
    const today = new Date();

    const dateString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    setLocalToday(dateString);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const response = await fetch("/api/bookings/options", {
          cache: "no-store",
        });

        const data: BookingOptions = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load booking options."
          );
        }

        if (active) {
          setSports(data.sports);
          setVenues(data.venues);
          setCourts(data.courts);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load booking options."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  function update(field: keyof typeof form, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "sport"
        ? { venue_id: "", court_id: "" }
        : {}),
      ...(field === "venue_id"
        ? { court_id: "" }
        : {}),
    }));

    setError("");
  }

  const filteredVenues = venues.filter(
    (venue) =>
      venue.type.trim().toLowerCase() ===
      form.sport.trim().toLowerCase()
  );

  const filteredCourts = courts.filter(
    (court) =>
      court.venue_id === Number(form.venue_id)
  );

  const selectedVenue = venues.find(
    (venue) =>
      venue.venue_id === Number(form.venue_id)
  );

  const durationMinutes = Number(form.duration);

  const amount =
    selectedVenue &&
    Number.isFinite(durationMinutes) &&
    durationMinutes > 0
      ? (Number(selectedVenue.price) * durationMinutes) / 60
      : 0;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (!form.venue_id || !form.court_id) {
      setError("Please select a venue and court.");
      return;
    }

    const validCourt = filteredCourts.some(
      (court) =>
        court.court_id === Number(form.court_id)
    );

    if (!validCourt) {
      setError("Please select a valid court.");
      return;
    }

    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 30 ||
      durationMinutes > 1410 ||
      durationMinutes % 30 !== 0
    ) {
      setError(
        "Choose a valid duration in 30-minute increments."
      );
      return;
    }

    if (!form.booking_date || !form.booking_time) {
      setError("Please choose a date and start time.");
      return;
    }

    if (localToday && form.booking_date < localToday) {
      setError("Booking date cannot be in the past.");
      return;
    }

    const [hours, minutes] = form.booking_time
      .split(":")
      .map(Number);

    const startMinutes = hours * 60 + minutes;

    if (startMinutes + durationMinutes > 1440) {
      setError(
        "Booking cannot extend past midnight."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          venue_id: Number(form.venue_id),
          court_id: Number(form.court_id),
          booking_date: form.booking_date,
          booking_time: form.booking_time,
          duration: durationMinutes,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to reserve court."
        );
      }

      const bookingId = Number(data.booking_id);

      if (!Number.isInteger(bookingId) || bookingId <= 0) {
        throw new Error("Invalid booking ID returned.");
      }

      router.push(
        `/bookings/pay?booking_id=${bookingId}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reserve court."
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <Link
          href="/dashboard"
          className="text-emerald-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-8 text-3xl font-bold">
          Personal Venue Booking
        </h1>

        <p className="mt-2 text-slate-400">
          Choose your sport, venue, court and preferred
          booking duration.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <label
              htmlFor="sport"
              className="mb-2 block text-sm"
            >
              Select Sport
            </label>

            <select
              id="sport"
              required
              disabled={loading || submitting}
              value={form.sport}
              onChange={(e) =>
                update("sport", e.target.value)
              }
              className={inputClass}
            >
              <option value="">Choose sport</option>

              {sports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="venue"
              className="mb-2 block text-sm"
            >
              Select Venue
            </label>

            <select
              id="venue"
              required
              disabled={!form.sport || submitting}
              value={form.venue_id}
              onChange={(e) =>
                update("venue_id", e.target.value)
              }
              className={inputClass}
            >
              <option value="">Choose venue</option>

              {filteredVenues.map((venue) => (
                <option
                  key={venue.venue_id}
                  value={venue.venue_id}
                >
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="court"
              className="mb-2 block text-sm"
            >
              Select Court
            </label>

            <select
              id="court"
              required
              disabled={!form.venue_id || submitting}
              value={form.court_id}
              onChange={(e) =>
                update("court_id", e.target.value)
              }
              className={inputClass}
            >
              <option value="">Choose court</option>

              {filteredCourts.map((court) => (
                <option
                  key={court.court_id}
                  value={court.court_id}
                >
                  {court.court_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="booking-date"
              className="mb-2 block text-sm"
            >
              Booking Date
            </label>

            <input
              id="booking-date"
              type="date"
              required
              min={localToday || undefined}
              disabled={submitting || !localToday}
              value={form.booking_date}
              onChange={(e) =>
                update("booking_date", e.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="booking-time"
              className="mb-2 block text-sm"
            >
              Start Time
            </label>

            <input
              id="booking-time"
              type="time"
              required
              disabled={submitting}
              value={form.booking_time}
              onChange={(e) =>
                update("booking_time", e.target.value)
              }
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-400">
              Court availability is checked when you submit.
            </p>
          </div>

          <div>
            <label
              htmlFor="duration"
              className="mb-2 block text-sm"
            >
              Booking Duration (Hours)
            </label>

            <input
              id="duration"
              type="number"
              required
              min="0.5"
              max="23.5"
              step="0.5"
              disabled={submitting}
              value={
                form.duration === ""
                  ? ""
                  : durationMinutes / 60
              }
              onChange={(e) => {
                const value = e.target.value;

                update(
                  "duration",
                  value === ""
                    ? ""
                    : String(Number(value) * 60)
                );
              }}
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-400">
              Select a duration in 30-minute increments.
            </p>
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-slate-800 p-4">
            <p className="text-sm text-slate-400">
              Hourly Rate: ₹
              {Number(
                selectedVenue?.price || 0
              ).toFixed(2)}
            </p>

            <p className="mt-2 text-xl font-bold text-emerald-400">
              Total: ₹{amount.toFixed(2)}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Final amount is verified by the server.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="text-sm text-red-400"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || submitting || !localToday}
            className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {submitting
              ? "Reserving Court..."
              : "Continue to Payment"}
          </button>
        </form>
      </div>
    </main>
  );
}
