import Link from "next/link";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface Booking extends RowDataPacket {
  booking_id: number;
  venue_name: string;
  booking_date: Date;
  booking_time: string;
  duration: number;
  amount: string;
  status: string;
}

export default async function BookingsPage() {
  const [bookings] = await pool.query<Booking[]>(
    `select
        b.booking_id,
        v.name as venue_name,
        b.booking_date,
        b.booking_time,
        b.duration,
        b.amount,
        b.status
     from booking b
     join venue v on b.venue_id = v.venue_id
     order by b.booking_date desc, b.booking_time desc`
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
        <h2 className="text-3xl font-bold">All Bookings</h2>

        <p className="mt-3 text-slate-400">
          Live booking records retrieved from MySQL.
        </p>

        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <th className="p-4">Booking ID</th>
                <th className="p-4">Venue</th>
                <th className="p-4">Date</th>
                <th className="p-4">Time</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking) => (
                <tr
                  key={booking.booking_id}
                  className="border-t border-slate-800 hover:bg-slate-900"
                >
                  <td className="p-4">{booking.booking_id}</td>

                  <td className="p-4 capitalize">{booking.venue_name}</td>

                  <td className="p-4">
                    {new Date(booking.booking_date).toLocaleDateString(
                      "en-IN",
                      { timeZone: "UTC" }
                    )}
                  </td>

                  <td className="p-4">{booking.booking_time}</td>

                  <td className="p-4">{booking.duration} min</td>

                  <td className="p-4">
                    ₹{Number(booking.amount).toLocaleString("en-IN")}
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-400">
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-5 text-sm text-slate-400">
          Total bookings: {bookings.length}
        </p>
      </section>
    </main>
  );
}
