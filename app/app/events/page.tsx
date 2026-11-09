
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

import EventAutoRefresh from "@/components/EventAutoRefresh";
import JoinEventButton from "@/components/JoinEventButton";
import DeleteEventButton from "@/components/DeleteEventButton";
import AuthNav from "@/components/AuthNav";

interface Event extends RowDataPacket {
  event_id: number;
  event_title: string;
  sport_type: string;
  event_date: Date;
  max_players: number;
  registered_players: number;
  created_by_user_id: number;
  venue_name: string;
  organizer_name: string;
}

async function EventsContent() {
  await connection();

  const session = await getSession();

  const [events] = await pool.query<Event[]>(
    `SELECT
        e.event_id,
        e.event_title,
        e.sport_type,
        e.event_date,
        e.max_players,
        e.created_by_user_id,
        v.name AS venue_name,
        u.name AS organizer_name,
        (
          SELECT COUNT(*)
          FROM event_registration er
          WHERE er.event_id = e.event_id
            AND er.status = 'registered'
        ) AS registered_players
     FROM event e
     JOIN venue v
       ON e.venue_id = v.venue_id
     JOIN user u
       ON e.created_by_user_id = u.user_id
     ORDER BY e.event_date, e.event_id`
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <EventAutoRefresh />

      <header className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-emerald-400">
            Playo <span className="text-white">with Stats</span>
          </h1>

          <div className="flex flex-wrap items-center gap-5">
            <Link
              href="/dashboard"
              className="text-sm text-slate-300 hover:text-white"
            >
              Back to Dashboard
            </Link>

            <AuthNav />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-3xl font-bold">
            Sports Events
          </h2>

          <Link
            href="/events/create"
            className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            + Create Event
          </Link>
        </div>

        <p className="mt-3 text-slate-400">
          Explore sports events and register to participate.
        </p>

        <p className="mt-6 text-emerald-400">
          Total events: {events.length}
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const registered = Number(event.registered_players);
            const maxPlayers = Number(event.max_players);

            const available = Math.max(
              0,
              maxPlayers - registered
            );

            const isFull = available === 0;

            const percentage =
              maxPlayers > 0
                ? Math.min(
                    100,
                    (registered / maxPlayers) * 100
                  )
                : 0;

            const isOrganizer =
              session?.userId ===
              Number(event.created_by_user_id);

            return (
              <div
                key={event.event_id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold capitalize text-emerald-400">
                    {event.sport_type}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isFull
                        ? "bg-red-500/10 text-red-400"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}
                  >
                    {isFull ? "Full" : "Available"}
                  </span>
                </div>

                <h3 className="mt-4 text-xl font-bold capitalize">
                  {event.event_title}
                </h3>

                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <p>
                    Date:{" "}
                    {new Date(
                      event.event_date
                    ).toLocaleDateString("en-IN", {
                      timeZone: "UTC",
                    })}
                  </p>

                  <p className="capitalize">
                    Venue: {event.venue_name}
                  </p>

                  <p className="capitalize">
                    Organizer: {event.organizer_name}
                  </p>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between text-sm">
                    <span>Registered Players</span>

                    <span className="font-bold text-emerald-400">
                      {registered} / {maxPlayers}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {available} slots available
                  </p>
                </div>

                <JoinEventButton
                  eventId={event.event_id}
                  isFull={isFull}
                />

                {isOrganizer && (
                  <div className="mt-4">
                    <Link
                      href={`/events/edit?id=${event.event_id}`}
                      className="block rounded-lg border border-blue-500 px-4 py-3 text-center font-semibold text-blue-400 transition hover:bg-blue-500/10"
                    >
                      Edit Event
                    </Link>

                    <DeleteEventButton
                      eventId={event.event_id}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-10 text-white">
          Loading sports events...
        </main>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
