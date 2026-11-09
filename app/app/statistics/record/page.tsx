
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Match {
  match_id: number;
  event_title: string;
  match_date: string;
  status: string;
}

interface Player {
  match_id: number;
  user_id: number;
  name: string;
}

interface StatType {
  type_id: number;
  name: string;
}

interface OptionsResponse {
  success: boolean;
  matches: Match[];
  players: Player[];
  stat_types: StatType[];
  message?: string;
}

export default function RecordStatisticsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [statTypes, setStatTypes] = useState<StatType[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    match_id: "",
    user_id: "",
    type_id: "",
    value: "",
  });

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:border-emerald-400 focus:outline-none";

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const response = await fetch("/api/statistics", {
          cache: "no-store",
        });

        const data: OptionsResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load statistics options."
          );
        }

        if (active) {
          setMatches(data.matches);
          setPlayers(data.players);
          setStatTypes(data.stat_types);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load statistics options."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, []);

  function update(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "match_id" ? { user_id: "" } : {}),
    }));

    setError("");
    setSuccess("");
  }

  const eligiblePlayers = players.filter(
    (player) =>
      player.match_id === Number(form.match_id)
  );

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !eligiblePlayers.some(
        (player) =>
          player.user_id === Number(form.user_id)
      )
    ) {
      setError("Please select a player from this match.");
      return;
    }

    if (
      form.value.trim() === "" ||
      !Number.isInteger(Number(form.value)) ||
      Number(form.value) < 0
    ) {
      setError("Enter a valid non-negative statistic value.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/statistics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          match_id: Number(form.match_id),
          user_id: Number(form.user_id),
          type_id: Number(form.type_id),
          value: Number(form.value),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save statistics."
        );
      }

      setSuccess(
        data.message || "Player statistic saved successfully."
      );

      setForm((previous) => ({
        ...previous,
        value: "",
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save player statistics."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <Link
          href="/statistics"
          className="text-emerald-400 hover:underline"
        >
          ← Back to Statistics
        </Link>

        <h1 className="mt-8 text-3xl font-bold">
          Record Player Statistics
        </h1>

        <p className="mt-2 text-slate-400">
          Record performance for players in completed matches
          you organized.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <div>
            <label
              htmlFor="match"
              className="mb-2 block text-sm text-slate-300"
            >
              Completed Match
            </label>

            <select
              id="match"
              required
              disabled={loading}
              value={form.match_id}
              onChange={(e) =>
                update("match_id", e.target.value)
              }
              className={inputClass}
            >
              <option value="">Select a match</option>

              {matches.map((match) => (
                <option
                  key={match.match_id}
                  value={match.match_id}
                >
                  #{match.match_id} — {match.event_title} (
                  {match.match_date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="player"
              className="mb-2 block text-sm text-slate-300"
            >
              Player
            </label>

            <select
              id="player"
              required
              disabled={!form.match_id || loading}
              value={form.user_id}
              onChange={(e) =>
                update("user_id", e.target.value)
              }
              className={inputClass}
            >
              <option value="">Select a player</option>

              {eligiblePlayers.map((player) => (
                <option
                  key={`${player.match_id}-${player.user_id}`}
                  value={player.user_id}
                >
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="stat-type"
              className="mb-2 block text-sm text-slate-300"
            >
              Statistic Type
            </label>

            <select
              id="stat-type"
              required
              disabled={loading}
              value={form.type_id}
              onChange={(e) =>
                update("type_id", e.target.value)
              }
              className={inputClass}
            >
              <option value="">Select statistic</option>

              {statTypes.map((type) => (
                <option key={type.type_id} value={type.type_id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="stat-value"
              className="mb-2 block text-sm text-slate-300"
            >
              Statistic Value
            </label>

            <input
              id="stat-value"
              type="number"
              required
              min="0"
              step="1"
              value={form.value}
              onChange={(e) =>
                update("value", e.target.value)
              }
              placeholder="Enter performance value"
              className={inputClass}
            />
          </div>

          {matches.length === 0 && !loading && !error && (
            <p className="text-sm text-amber-400">
              No completed matches are available for your
              account. Statistics can be recorded after
              a match is marked completed.
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="text-sm text-emerald-400">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              saving ||
              matches.length === 0 ||
              eligiblePlayers.length === 0
            }
            className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Player Statistics"}
          </button>
        </form>
      </div>
    </main>
  );
}
