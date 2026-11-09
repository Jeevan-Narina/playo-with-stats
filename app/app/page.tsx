import Link from "next/link";
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

export default async function Home() {
  const [venues] = await pool.query<Venue[]>(
    "select venue_id, name, address, type, price from venue order by venue_id"
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-bold text-emerald-400">
            Playo <span className="text-white">with Stats</span>
          </h1>
          <nav className="flex gap-6 text-sm text-slate-300">
            <Link href="/">Venues</Link><Link href="/bookings">Bookings</Link>
            <Link href="/events">Events</Link>
            <Link href="/teams">Teams</Link>
            <Link href="/statistics">Statistics</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="mb-3 font-semibold text-emerald-400">
          FIND YOUR NEXT GAME
        </p>

        <h2 className="text-4xl font-bold">Discover Sports Venues</h2>

        <p className="mt-4 text-slate-400">
          Explore venues and book your next game directly through MySQL.
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
    </main>
  );
}





