import Link from "next/link";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface TeamRow extends RowDataPacket {
  team_id: number;
  team_name: string;
  user_id: number | null;
  player_name: string | null;
}

export default async function TeamsPage() {
  const [rows] = await pool.query<TeamRow[]>(
    `select
        t.team_id,
        t.name as team_name,
        u.user_id,
        u.name as player_name
     from team t
     left join team_member tm on t.team_id = tm.team_id
     left join user u on tm.user_id = u.user_id
     order by t.team_id, u.user_id`
  );

  const teams = new Map<
    number,
    { id: number; name: string; players: string[] }
  >();

  for (const row of rows) {
    if (!teams.has(row.team_id)) {
      teams.set(row.team_id, {
        id: row.team_id,
        name: row.team_name,
        players: [],
      });
    }

    if (row.player_name) {
      teams.get(row.team_id)!.players.push(row.player_name);
    }
  }

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
        <h2 className="text-3xl font-bold">Sports Teams</h2>

        <p className="mt-3 text-slate-400">
          Teams and members retrieved directly from MySQL.
        </p>

        <p className="mt-6 text-emerald-400">
          Total teams: {teams.size}
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from(teams.values()).map((team) => (
            <div
              key={team.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <h3 className="text-xl font-bold capitalize text-emerald-400">
                {team.name}
              </h3>

              <p className="mt-3 text-sm text-slate-400">
                {team.players.length} players
              </p>

              <div className="mt-5 border-t border-slate-700 pt-4">
                <h4 className="mb-3 font-semibold">Team Members</h4>

                <ul className="space-y-2">
                  {team.players.map((player, index) => (
                    <li
                      key={index}
                      className="rounded-lg bg-slate-800 px-3 py-2 text-sm capitalize"
                    >
                      {player}
                    </li>
                  ))}
                </ul>

                {team.players.length === 0 && (
                  <p className="text-sm text-slate-400">
                    No members assigned.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
