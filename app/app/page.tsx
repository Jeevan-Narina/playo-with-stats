
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import pool from "@/lib/db";
import BookingForm from "@/components/BookingForm";
import type { RowDataPacket } from "mysql2";

interface Venue extends RowDataPacket {
  venue_id: number;
  name: string;
  address: string;
  type: string;
  price: string;
}

async function HomeContent() {
  // Database data is loaded at request time.
  await connection();

  const [venues] = await pool.query<Venue[]>(
    `SELECT
       venue_id,
       name,
       address,
       type,
       price
     FROM venue
     ORDER BY venue_id`
  );

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <p className="mb-3 font-semibold text-emerald-400">
        FIND YOUR NEXT GAME
      </p>

      <h2 className="text-4xl font-bold">
        Discover Sports Venues
      </h2>

      <p className="mt-4 text-slate-400">
        Explore venues and book your next game.
      </p>

      <h3 className="mb-6 mt-10 text-xl font-semibold">
        Available Venues ({venues.length})
      </h3>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {venues.map((venue) => (
          <div
            key={venue.venue_id}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
          >
            <span className="text-sm font-semibold capitalize text-emerald-400">
              {venue.type}
            </span>

            <h3 className="mt-3 text-xl font-bold capitalize">
              {venue.name}
            </h3>

            <p className="mt-2 text-sm capitalize text-slate-400">
              {venue.address}
            </p>

            <p className="my-5 text-xl font-bold text-emerald-400">
              ₹{Number(venue.price).toLocaleString("en-IN")}/hour
            </p>

            <BookingForm
              venueId={venue.venue_id}
              venueName={venue.name}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-emerald-400">
            Playo <span className="text-white">with Stats</span>
          </h1>

          <nav className="flex flex-wrap gap-6 text-sm text-slate-300">
            <Link href="/">Venues</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/bookings">Bookings</Link>
            <Link href="/events">Events</Link>
            <Link href="/teams">Teams</Link>
            <Link href="/statistics">Statistics</Link>
          </nav>
        </div>
      </header>

      <Suspense
        fallback={
          <section className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="text-3xl font-bold">
              Discover Sports Venues
            </h2>

            <p className="mt-5 text-slate-400">
              Loading available venues...
            </p>
          </section>
        }
      >
        <HomeContent />
      </Suspense>
    </main>
  );
}
