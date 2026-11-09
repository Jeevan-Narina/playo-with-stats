"use client";

import { useState } from "react";

interface BookingFormProps {
  venueId: number;
  venueName: string;
}

export default function BookingForm({
  venueId,
  venueName,
}: BookingFormProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue_id: venueId,
          booking_date: date,
          booking_time: time,
          duration,
        }),
      });

      const result = await response.json();

      setMessage(result.message || "Booking request completed.");

      if (response.ok) {
        setDate("");
        setTime("");
      }
    } catch {
      setMessage("Unable to connect to the booking service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleBooking}
      className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-6"
    >
      <h3 className="text-lg font-bold">Book {venueName}</h3>

      <div>
        <label htmlFor={`date-${venueId}`} className="mb-1 block text-sm">
          Booking Date
        </label>
        <input
          id={`date-${venueId}`}
          type="date"
          required
          value={date}
          min={new Date().toLocaleDateString("en-CA")}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg bg-slate-800 p-3 text-white"
        />
      </div>

      <div>
        <label htmlFor={`time-${venueId}`} className="mb-1 block text-sm">
          Start Time
        </label>
        <input
          id={`time-${venueId}`}
          type="time"
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full rounded-lg bg-slate-800 p-3 text-white"
        />
      </div>

      <div>
        <label htmlFor={`duration-${venueId}`} className="mb-1 block text-sm">
          Duration
        </label>
        <select
          id={`duration-${venueId}`}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full rounded-lg bg-slate-800 p-3 text-white"
        >
          <option value={60}>1 hour</option>
          <option value={90}>1.5 hours</option>
          <option value={120}>2 hours</option>
          <option value={180}>3 hours</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-50"
      >
        {loading ? "Booking..." : "Confirm Booking"}
      </button>

      {message && (
        <p role="status" className="text-sm text-emerald-300">
          {message}
        </p>
      )}
    </form>
  );
}
