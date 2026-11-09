
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

interface EventDetails {
  event_id: number;
  event_title: string;
  sport_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  max_players: number;
  created_by_user_id: number;
}

function EditEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = Number(searchParams.get("id"));

  const [form, setForm] = useState({
    event_title: "",
    sport_type: "",
    event_date: "",
    start_time: "",
    end_time: "",
    max_players: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEvent() {
      if (!Number.isInteger(eventId) || eventId <= 0) {
        setMessage("Invalid event ID.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/events/detail?id=${eventId}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load event.");
        }

        if (active) {
          const event: EventDetails = data.event;

          setForm({
            event_title: event.event_title,
            sport_type: event.sport_type,
            event_date: event.event_date,
            start_time: event.start_time.slice(0, 5),
            end_time: event.end_time.slice(0, 5),
            max_players: String(event.max_players),
          });
        }
      } catch (err) {
        if (active) {
          setMessage(
            err instanceof Error ? err.message : "Unable to load event."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEvent();

    return () => {
      active = false;
    };
  }, [eventId]);

  function update(field: keyof typeof form, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/events/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          ...form,
          max_players: Number(form.max_players),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Unable to update event.");
        return;
      }

      router.push("/events");
      router.refresh();
    } catch {
      setMessage("Unable to connect to server.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white";

  if (loading) {
    return <p className="mt-8 text-slate-400">Loading event...</p>;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6"
    >
      {(
        [
          ["event_title", "Event Title", "text"],
          ["sport_type", "Sport Type", "text"],
          ["event_date", "Event Date", "date"],
          ["start_time", "Start Time", "time"],
          ["end_time", "End Time", "time"],
          ["max_players", "Maximum Players", "number"],
        ] as const
      ).map(([field, label, type]) => (
        <div key={field}>
          <label className="mb-2 block text-sm text-slate-300">
            {label}
          </label>

          <input
            type={type}
            required
            min={type === "number" ? 1 : undefined}
            value={form[field]}
            onChange={(e) => update(field, e.target.value)}
            className={inputClass}
          />
        </div>
      ))}

      {message && (
        <p role="alert" className="text-sm text-red-400">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={saving || !form.event_title}
        className="w-full cursor-pointer rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {saving ? "Saving Changes..." : "Save Changes"}
      </button>
    </form>
  );
}

export default function EditEventPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <Link href="/events" className="text-emerald-400">
          ← Back to Events
        </Link>

        <h1 className="mt-8 text-3xl font-bold">
          Edit Sports Event
        </h1>

        <Suspense fallback={<p>Loading...</p>}>
          <EditEventForm />
        </Suspense>
      </div>
    </main>
  );
}
