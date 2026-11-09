import Link from "next/link";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface Event extends RowDataPacket {
  event_id: number;
  event_title: string;
  sport_type: string;
  event_date: Date;
  max_players: number;
  venue_name: string;
  organizer_name: string;
}

export default async function EventsPage() {
  const [events] = await pool.query<Event[]>(
    `select
        e.event_id,
        e.event_title,
        e.sport_type,
        e.event_date,
        e.max_players,
        v.name as venue_name,
        u.name as organizer_name
     from event e
     join venue v on e.venue_id = v.venue_id
     join user u on e.created_by_user_id = u.user_id
     order by e.event_date, e.event_id`
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-bold text-emerald-400">
            Playo <span className="text-white">with Stats</span>
          </h1>
          <Link href="/" className="text-sm text-slate-300 hover:text-white">
            Back to Venues
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-bold">Sports Events</h2>
        <p className="mt-3 text-slate-400">
          Explore sports events stored in our MySQL database.
        </p>

        <p className="mt-6 text-emerald-400">
          Total events: {events.length}
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.event_id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <span className="text-sm font-semibold capitalize text-emerald-400">
                {event.sport_type}
              </span>

              <h3 className="mt-3 text-xl font-bold capitalize">
                {event.event_title}
              </h3>

              <div className="mt-4 space-y-2 text-sm text-slate-300">
                <p>
                  Date:{" "}
                  {new Date(event.event_date).toLocaleDateString("en-IN", {
                    timeZone: "UTC",
                  })}
                </p>
                <p className="capitalize">Venue: {event.venue_name}</p>
                <p className="capitalize">Organizer: {event.organizer_name}</p>
                <p>Maximum players: {event.max_players}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
