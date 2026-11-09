
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface JoinEventButtonProps {
  eventId: number;
  isFull: boolean;
}

export default function JoinEventButton({
  eventId,
  isFull,
}: JoinEventButtonProps) {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAction(action: "join" | "cancel") {
    const endpoint =
      action === "cancel"
        ? "/api/events/cancel"
        : isFull
          ? "/api/waitlist/join"
          : "/api/events/register";

    setLoading(true);
    setMessage("");
    setError(false);
    setLoginRequired(false);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        setLoginRequired(true);
        setError(true);
        setMessage("Please log in to continue.");
        return;
      }

      setMessage(result.message || "Request completed.");
      setError(!response.ok);

      if (response.ok) {
        router.refresh();
      }
    } catch {
      setError(true);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-5 space-y-3">
      <button
        type="button"
        onClick={() => handleAction("join")}
        disabled={loading}
        className={`w-full cursor-pointer rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-50 ${
          isFull
            ? "bg-amber-600 hover:bg-amber-500"
            : "bg-emerald-600 hover:bg-emerald-500"
        }`}
      >
        {loading
          ? "Processing..."
          : isFull
            ? "Join Waitlist"
            : "Join Event"}
      </button>

      <button
        type="button"
        onClick={() => handleAction("cancel")}
        disabled={loading}
        className="w-full cursor-pointer rounded-lg border border-red-500 px-4 py-3 font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
      >
        Cancel Registration
      </button>

      {message && (
        <p
          role="status"
          className={`text-sm ${
            error ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {message}
        </p>
      )}

      {loginRequired && (
        <Link
          href="/login"
          className="block text-sm font-semibold text-emerald-400 hover:underline"
        >
          Go to Login
        </Link>
      )}
    </div>
  );
}
