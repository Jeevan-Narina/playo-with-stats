
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSession } from "@/lib/auth";

async function DashboardContent() {
  await connection();

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-emerald-400">
          Playo <span className="text-white">with Stats</span>
        </h1>

        <Link
          href="/profile"
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
        >
          My Profile
        </Link>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-4xl font-bold">
          What would you like to book?
        </h2>

        <p className="mt-4 text-slate-400">
          Choose how you want to play.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Link
          href="/events"
          className="group rounded-2xl border border-slate-700 bg-slate-900 p-8 transition hover:border-emerald-400 hover:bg-slate-800"
        >
          <div className="text-5xl">🏆</div>

          <h3 className="mt-6 text-2xl font-bold">
            Event Booking
          </h3>

          <p className="mt-3 text-slate-400">
            Discover sports events, register to participate,
            join waitlists, and manage your registrations.
          </p>

          <div className="mt-8 font-semibold text-emerald-400">
            Explore Events →
          </div>
        </Link>

        <Link
          href="/bookings"
          className="group rounded-2xl border border-slate-700 bg-slate-900 p-8 transition hover:border-emerald-400 hover:bg-slate-800"
        >
          <div className="text-5xl">📅</div>

          <h3 className="mt-6 text-2xl font-bold">
            Personal Booking
          </h3>

          <p className="mt-3 text-slate-400">
            Reserve a sports venue for personal practice
            or games with friends, choosing your own date
            and time.
          </p>

          <div className="mt-8 font-semibold text-emerald-400">
            Book a Venue →
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Suspense
        fallback={
          <div className="p-10 text-center text-slate-400">
            Loading dashboard...
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </main>
  );
}
