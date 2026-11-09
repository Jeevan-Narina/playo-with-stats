
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { RowDataPacket } from "mysql2";

interface StatRow extends RowDataPacket {
  user_id: number;
  stat_type: string;
  total_value: number;
}

interface SportRow extends RowDataPacket {
  sport_type: string;
}

interface TeammateRow extends RowDataPacket {
  user_id: number;
  name: string;
}

interface PlayerRow extends RowDataPacket {
  name: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface PageProps {
  searchParams: Promise<{
    sport?: string;
    compare?: string;
    teammate?: string;
  }>;
}

async function StatisticsContent({
  searchParams,
}: PageProps) {
  await connection();

  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const userId = session.userId;
  const params = await searchParams;

  const [users] = await pool.query<PlayerRow[]>(
    "SELECT name FROM `user` WHERE user_id = ?",
    [userId]
  );

  const playerName = users[0]?.name || "Player";

  // Show every sport available in the event database.
  const [sportRows] = await pool.query<SportRow[]>(
    `SELECT DISTINCT sport_type
     FROM event
     WHERE sport_type IS NOT NULL
       AND TRIM(sport_type) <> ''
     ORDER BY sport_type`
  );

  const sports = sportRows.map((row) => row.sport_type);

  const selectedSport =
    params.sport && sports.includes(params.sport)
      ? params.sport
      : sports.find(
          (sport) => sport.toLowerCase() === "badminton"
        ) || sports[0] || "";

  // Only the logged-in player's statistics.
  const [myStats] = await pool.query<StatRow[]>(
    `SELECT
       ps.user_id,
       st.name AS stat_type,
       SUM(ps.value) AS total_value
     FROM player_stat ps
     JOIN \`match\` m
       ON ps.match_id = m.match_id
     JOIN event e
       ON m.event_id = e.event_id
     JOIN stat_type st
       ON ps.type_id = st.type_id
     WHERE ps.user_id = ?
       AND e.sport_type = ?
     GROUP BY
       ps.user_id,
       st.type_id,
       st.name
     ORDER BY st.name`,
    [userId, selectedSport]
  );

  const [matchCounts] = await pool.query<CountRow[]>(
    `SELECT COUNT(DISTINCT ps.match_id) AS total
     FROM player_stat ps
     JOIN \`match\` m
       ON ps.match_id = m.match_id
     JOIN event e
       ON m.event_id = e.event_id
     WHERE ps.user_id = ?
       AND e.sport_type = ?`,
    [userId, selectedSport]
  );

  // Find players who share a team with the current user.
  const [teammates] = await pool.query<TeammateRow[]>(
    `SELECT DISTINCT
       u.user_id,
       u.name
     FROM team_member mine
     JOIN team_member other_member
       ON mine.team_id = other_member.team_id
     JOIN \`user\` u
       ON other_member.user_id = u.user_id
     WHERE mine.user_id = ?
       AND other_member.user_id <> ?
     ORDER BY u.name`,
    [userId, userId]
  );

  const showComparison = params.compare === "1";

  const requestedTeammate = Number(params.teammate);

  const selectedTeammate =
    teammates.find(
      (person) =>
        Number(person.user_id) === requestedTeammate
    ) || teammates[0];

  let teammateStats: StatRow[] = [];
  let teammateMatches = 0;

  if (showComparison && selectedTeammate && selectedSport) {
    const [rows] = await pool.query<StatRow[]>(
      `SELECT
         ps.user_id,
         st.name AS stat_type,
         SUM(ps.value) AS total_value
       FROM player_stat ps
       JOIN \`match\` m
         ON ps.match_id = m.match_id
       JOIN event e
         ON m.event_id = e.event_id
       JOIN stat_type st
         ON ps.type_id = st.type_id
       WHERE ps.user_id = ?
         AND e.sport_type = ?
       GROUP BY
         ps.user_id,
         st.type_id,
         st.name
       ORDER BY st.name`,
      [selectedTeammate.user_id, selectedSport]
    );

    teammateStats = rows;

    const [counts] = await pool.query<CountRow[]>(
      `SELECT COUNT(DISTINCT ps.match_id) AS total
       FROM player_stat ps
       JOIN \`match\` m
         ON ps.match_id = m.match_id
       JOIN event e
         ON m.event_id = e.event_id
       WHERE ps.user_id = ?
         AND e.sport_type = ?`,
      [selectedTeammate.user_id, selectedSport]
    );

    teammateMatches = Number(counts[0]?.total || 0);
  }

  const myMatches = Number(matchCounts[0]?.total || 0);

  const comparisonTypes = Array.from(
    new Set([
      ...myStats.map((stat) => stat.stat_type),
      ...teammateStats.map((stat) => stat.stat_type),
    ])
  ).sort();

  function statValue(rows: StatRow[], name: string) {
    const stat = rows.find((row) => row.stat_type === name);

    return stat ? Number(stat.total_value) : "—";
  }

  const sportQuery = encodeURIComponent(selectedSport);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-emerald-400">
            Playo <span className="text-white">with Stats</span>
          </h1>

          <Link
            href="/dashboard"
            className="text-sm text-slate-300 hover:text-white"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">
              My Player Statistics
            </h2>

            <p className="mt-2 text-slate-400">
              Welcome, {playerName}
            </p>
          </div>

          <Link
            href="/statistics/record"
            className="rounded-lg border border-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10"
          >
            Record Match Statistics
          </Link>
        </div>

        {sports.length === 0 ? (
          <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-slate-300">
              No sports are available yet.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-10">
              <h3 className="mb-4 font-semibold">
                Select Sport
              </h3>

              <div className="flex flex-wrap gap-3">
                {sports.map((sport) => (
                  <Link
                    key={sport}
                    href={`/statistics?sport=${encodeURIComponent(sport)}`}
                    className={`rounded-lg px-5 py-3 text-sm font-semibold capitalize ${
                      selectedSport === sport
                        ? "bg-emerald-500 text-slate-950"
                        : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {sport}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-xl font-bold capitalize text-emerald-400">
                My {selectedSport} Performance
              </h3>

              {myStats.length === 0 ? (
                <div className="mt-5 rounded-lg bg-slate-800 p-5">
                  <p className="font-semibold">
                    No statistics recorded yet
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    Your performance will appear here once
                    an event organizer records statistics
                    for your completed matches.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div className="rounded-lg bg-slate-800 p-5">
                    <p className="text-sm text-slate-400">
                      Matches with Recorded Stats
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      {myMatches}
                    </p>
                  </div>

                  {myStats.map((stat) => (
                    <div
                      key={stat.stat_type}
                      className="rounded-lg bg-slate-800 p-5"
                    >
                      <p className="text-sm capitalize text-slate-400">
                        {stat.stat_type}
                      </p>

                      <p className="mt-2 text-3xl font-bold text-emerald-400">
                        {Number(stat.total_value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8">
              {!showComparison ? (
                <Link
                  href={`/statistics?sport=${sportQuery}&compare=1`}
                  className="inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  Compare with Teammates
                </Link>
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-xl font-bold">
                      Teammate Comparison
                    </h3>

                    <Link
                      href={`/statistics?sport=${sportQuery}`}
                      className="text-sm text-slate-400 hover:text-white"
                    >
                      Hide Comparison
                    </Link>
                  </div>

                  {teammates.length === 0 ? (
                    <p className="mt-5 text-slate-400">
                      You do not have any teammates
                      registered yet.
                    </p>
                  ) : (
                    <>
                      <form
                        action="/statistics"
                        method="GET"
                        className="mt-6 flex flex-wrap items-end gap-3"
                      >
                        <input
                          type="hidden"
                          name="sport"
                          value={selectedSport}
                        />

                        <input
                          type="hidden"
                          name="compare"
                          value="1"
                        />

                        <div className="flex-1">
                          <label
                            htmlFor="teammate"
                            className="mb-2 block text-sm"
                          >
                            Select Teammate
                          </label>

                          <select
                            key={selectedTeammate?.user_id}
                            id="teammate"
                            name="teammate"
                            defaultValue={
                              selectedTeammate?.user_id
                            }
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3"
                          >
                            {teammates.map((person) => (
                              <option
                                key={person.user_id}
                                value={person.user_id}
                              >
                                {person.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="submit"
                          className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
                        >
                          Compare
                        </button>
                      </form>

                      <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-800">
                            <tr>
                              <th className="p-4">Statistic</th>
                              <th className="p-4">Me</th>
                              <th className="p-4">
                                {selectedTeammate?.name}
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            <tr className="border-t border-slate-800">
                              <td className="p-4">
                                Matches with Recorded Stats
                              </td>

                              <td className="p-4 font-semibold text-emerald-400">
                                {myMatches}
                              </td>

                              <td className="p-4 font-semibold">
                                {teammateMatches}
                              </td>
                            </tr>

                            {comparisonTypes.map((type) => (
                              <tr
                                key={type}
                                className="border-t border-slate-800"
                              >
                                <td className="p-4 capitalize">
                                  {type}
                                </td>

                                <td className="p-4 font-semibold text-emerald-400">
                                  {statValue(myStats, type)}
                                </td>

                                <td className="p-4 font-semibold">
                                  {statValue(teammateStats, type)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {comparisonTypes.length === 0 && (
                        <p className="mt-4 text-sm text-slate-400">
                          Neither player has recorded
                          statistics for this sport yet.
                        </p>
                      )}

                      <p className="mt-4 text-xs text-slate-400">
                        Only statistics recorded for the
                        selected sport are compared.
                        A dash means no recorded value.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default function StatisticsPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-10 text-white">
          Loading player statistics...
        </main>
      }
    >
      <StatisticsContent {...props} />
    </Suspense>
  );
}
