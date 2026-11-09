import Link from "next/link";
import { connection } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface PlayerStat extends RowDataPacket {
  user_id: number;
  player_name: string;
  stat_type: string;
  total_value: number;
}

export default async function StatisticsPage() {
  await connection();
  const [statistics] = await pool.query<PlayerStat[]>(
    `select
        u.user_id,
        u.name as player_name,
        st.name as stat_type,
        sum(ps.value) as total_value
     from player_stat ps
     join user u on ps.user_id = u.user_id
     join stat_type st on ps.type_id = st.type_id
     group by u.user_id, u.name, st.type_id, st.name
     order by u.name, st.name`
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-bold text-emerald-400">
            Playo <span className="text-white">with Stats</span>
          </h1>
          <Link href="/" className="text-sm text-slate-300">
            Back to Venues
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-bold">Player Statistics</h2>

        <p className="mt-3 text-slate-400">
          Player performance statistics retrieved from MySQL.
        </p>

        <p className="mt-6 text-emerald-400">
          Total statistic records: {statistics.length}
        </p>

        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-4">Player</th>
                <th className="p-4">Statistic</th>
                <th className="p-4">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {statistics.map((stat) => (
                <tr
                  key={`${stat.user_id}-${stat.stat_type}`}
                  className="border-t border-slate-800"
                >
                  <td className="p-4 capitalize">{stat.player_name}</td>
                  <td className="p-4 capitalize">{stat.stat_type}</td>
                  <td className="p-4 text-emerald-400">{stat.total_value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

