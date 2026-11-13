
"use client";

import { useEffect, useState } from "react";

interface PlayerStatistic {
  stat_id: number;
  sport_type: string;
  event_title: string;
  match_date: string;
  statistic: string;
  value: number;
}

interface StatisticsResponse {
  success: boolean;
  message?: string;
  statistics?: PlayerStatistic[];
}

const sportIcons: Record<string, string> = {
  badminton: "🏸",
  football: "⚽",
  cricket: "🏏",
  basketball: "🏀",
  tennis: "🎾",
  volleyball: "🏐",
};

export default function MySportsStatistics() {
  const [statistics, setStatistics] = useState<
    PlayerStatistic[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStatistics() {
      try {
        const response = await fetch(
          "/api/profile/statistics",
          {
            credentials: "same-origin",
            cache: "no-store",
          }
        );

        const data: StatisticsResponse =
          await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load statistics."
          );
        }

        if (active) {
          setStatistics(data.statistics || []);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load statistics."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStatistics();

    return () => {
      active = false;
    };
  }, []);

  const grouped = statistics.reduce<
    Record<string, PlayerStatistic[]>
  >((groups, stat) => {
    const sport = stat.sport_type.toLowerCase();

    if (!groups[sport]) {
      groups[sport] = [];
    }

    groups[sport].push(stat);

    return groups;
  }, {});

  const sports = Object.keys(grouped).sort();

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">
            My Sports Statistics
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Your recorded performance across sports and matches.
          </p>
        </div>

        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-400">
          {sports.length} Sports
        </span>
      </div>

      {loading ? (
        <p className="mt-6 text-slate-400">
          Loading your statistics...
        </p>
      ) : error ? (
        <p className="mt-6 text-red-400">
          {error}
        </p>
      ) : statistics.length === 0 ? (
        <div className="mt-6 rounded-xl bg-slate-800 p-6">
          <p className="text-slate-300">
            No sports statistics have been recorded
            for your account yet.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {sports.map((sport) => (
            <div
              key={sport}
              className="rounded-xl border border-slate-700 bg-slate-800 p-5"
            >
              <h4 className="text-lg font-bold capitalize">
                {sportIcons[sport] || "🏅"} {sport}
              </h4>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {grouped[sport].map((stat) => (
                  <div
                    key={stat.stat_id}
                    className="rounded-lg border border-slate-700 bg-slate-900 p-5"
                  >
                    <p className="text-sm capitalize text-slate-400">
                      {stat.statistic}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-emerald-400">
                      {stat.value}
                    </p>

                    <p className="mt-3 text-sm capitalize text-slate-300">
                      {stat.event_title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Match date: {stat.match_date}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
