
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Venue {
  venue_id: number;
  name: string;
  type: string;
}

interface EventOptions {
  success: boolean;
  venues: Venue[];
  sports: string[];
  message?: string;
}

export default function CreateEventPage() {
  const router = useRouter();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [sports, setSports] = useState<string[]>([]);

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  const [form, setForm] = useState({
    event_title: "",
    sport_type: "",
    event_date: "",
    start_time: "",
    end_time: "",
    max_players: "",
    venue_id: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none";

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const response = await fetch("/api/events/options", {
          cache: "no-store",
        });

        const data: EventOptions = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load event options."
          );
        }

        if (active) {
          setVenues(data.venues);
          setSports(data.sports);
        }
      } catch (error) {
        if (active) {
          setOptionsError(
            error instanceof Error
              ? error.message
              : "Unable to load sports and venues."
          );
        }
      } finally {
        if (active) {
          setOptionsLoading(false);
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
    }));

    setMessage("");
  }

  function handleSportChange(sport: string) {
    setForm((previous) => ({
      ...previous,
      sport_type: sport,
      venue_id: "",
    }));

    setMessage("");
  }

  const filteredVenues = venues.filter(
    (venue) =>
      venue.type.trim().toLowerCase() ===
      form.sport_type.trim().toLowerCase()
  );

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const venueIsValid = filteredVenues.some(
      (venue) => venue.venue_id === Number(form.venue_id)
    );

    if (!venueIsValid) {
      setMessage("Please select a venue for the chosen sport.");
      return;
    }

    if (form.start_time >= form.end_time) {
      setMessage("End time must be after start time.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_title: form.event_title,
          sport_type: form.sport_type,
          event_date: form.event_date,
          start_time: form.start_time,
          end_time: form.end_time,
          max_players: Number(form.max_players),
          venue_id: Number(form.venue_id),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Unable to create event.");
        return;
      }

      router.push("/events");
      router.refresh();
    } catch {
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <Link
          href="/events"
          className="text-emerald-400 hover:underline"
        >
          ← Back to Events
        </Link>

        <h1 className="mt-8 text-3xl font-bold">
          Create Sports Event
        </h1>

        <p className="mt-2 text-slate-400">
          Choose a sport to view its available venues.
          You will automatically be the event organizer.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <label
              htmlFor="event-title"
              className="mb-2 block text-sm text-slate-300"
            >
              Event Title
            </label>

            <input
              id="event-title"
              type="text"
              required
              maxLength={100}
              value={form.event_title}
              onChange={(e) =>
                update("event_title", e.target.value)
              }
              placeholder="Weekend Doubles Tournament"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="sport-type"
              className="mb-2 block text-sm text-slate-300"
            >
              Sport Type
            </label>

            <select
              id="sport-type"
              required
              value={form.sport_type}
              onChange={(e) =>
                handleSportChange(e.target.value)
              }
              disabled={optionsLoading}
              className={inputClass}
            >
              <option value="">Select a sport</option>

              {sports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="event-date"
              className="mb-2 block text-sm text-slate-300"
            >
              Event Date
            </label>

            <input
              id="event-date"
              type="date"
              required
              value={form.event_date}
              onChange={(e) =>
                update("event_date", e.target.value)
              }
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="start-time"
                className="mb-2 block text-sm text-slate-300"
              >
                Start Time
              </label>

              <input
                id="start-time"
                type="time"
                required
                value={form.start_time}
                onChange={(e) =>
                  update("start_time", e.target.value)
                }
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="end-time"
                className="mb-2 block text-sm text-slate-300"
              >
                End Time
              </label>

              <input
                id="end-time"
                type="time"
                required
                value={form.end_time}
                onChange={(e) =>
                  update("end_time", e.target.value)
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="max-players"
              className="mb-2 block text-sm text-slate-300"
            >
              Maximum Players
            </label>

            <input
              id="max-players"
              type="number"
              required
              min={1}
              step={1}
              value={form.max_players}
              onChange={(e) =>
                update("max_players", e.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="venue"
              className="mb-2 block text-sm text-slate-300"
            >
              Event Venue
            </label>

            <select
              id="venue"
              required
              value={form.venue_id}
              onChange={(e) =>
                update("venue_id", e.target.value)
              }
              disabled={
                optionsLoading ||
                !form.sport_type ||
                filteredVenues.length === 0
              }
              className={inputClass}
            >
              <option value="">
                {!form.sport_type
                  ? "Select a sport first"
                  : filteredVenues.length === 0
                    ? "No matching venues"
                    : "Select a venue"}
              </option>

              {filteredVenues.map((venue) => (
                <option
                  key={venue.venue_id}
                  value={venue.venue_id}
                >
                  {venue.name}
                </option>
              ))}
            </select>

            {form.sport_type && (
              <p className="mt-2 text-sm text-emerald-400">
                {filteredVenues.length} matching venue(s)
                for {form.sport_type}
              </p>
            )}
          </div>

          {optionsLoading && (
            <p className="text-sm text-slate-400">
              Loading sports and venues...
            </p>
          )}

          {optionsError && (
            <p role="alert" className="text-sm text-red-400">
              {optionsError}
            </p>
          )}

          {message && (
            <p role="alert" className="text-sm text-red-400">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              optionsLoading ||
              !!optionsError ||
              !form.sport_type ||
              filteredVenues.length === 0
            }
            className="w-full cursor-pointer rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating Event..." : "Create Event"}
          </button>
        </form>
      </div>
    </main>
  );
}
