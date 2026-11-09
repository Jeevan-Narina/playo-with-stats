
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  user_id: number;
  name: string;
  email: string;
}

interface RegisteredEvent {
  event_id: number;
  event_title: string;
  sport_type: string;
  event_date: string;
  venue_name: string;
  registration_status: string;
  registered_at: string;
}

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);

  const [registeredEvents, setRegisteredEvents] =
    useState<RegisteredEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load profile.");
        }

        const data = await response.json();

        if (active) {
          setUser(data.user);
        }

        const photoResponse = await fetch("/api/profile/photo", {
          cache: "no-store",
        });

        if (photoResponse.ok && photoResponse.status === 200) {
          const blob = await photoResponse.blob();

          if (blob.size > 0) {
            const url = URL.createObjectURL(blob);

            if (active) {
              setPhotoUrl(url);
            } else {
              URL.revokeObjectURL(url);
            }
          }
        }
      } catch (err) {
        console.error("Profile loading error:", err);

        if (active) {
          setError("Unable to load your profile.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        const response = await fetch("/api/profile/events", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load sports activities.");
        }

        const data = await response.json();

        if (active) {
          setRegisteredEvents(data.events ?? []);
        }
      } catch (err) {
        console.error("Events loading error:", err);

        if (active) {
          setEventsError("Unable to load your sports activities.");
        }
      } finally {
        if (active) {
          setEventsLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function getInitials(name: string) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  async function chooseAndUploadPhoto(file: File | undefined) {
    if (!file) return;

    setMessage("");
    setMessageError(false);

    if (file.size === 0 || file.size > MAX_SIZE) {
      setMessage("Photo must be 2 MB or smaller.");
      setMessageError(true);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage("Only JPG, PNG and WebP images are allowed.");
      setMessageError(true);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    setMessage("Uploading profile picture...");

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to upload profile picture."
        );
      }

      const photoResponse = await fetch("/api/profile/photo", {
        cache: "no-store",
      });

      if (!photoResponse.ok || photoResponse.status !== 200) {
        throw new Error(
          "Photo saved but could not be displayed."
        );
      }

      const blob = await photoResponse.blob();

      if (blob.size === 0) {
        throw new Error("Retrieved photo is empty.");
      }

      setPhotoUrl(URL.createObjectURL(blob));
      setPreviewUrl(null);
      setMessage("Profile picture updated successfully!");
      setMessageError(false);

      router.refresh();
    } catch (err) {
      console.error("Photo upload error:", err);

      setMessage(
        err instanceof Error
          ? err.message
          : "Unable to upload profile picture."
      );

      setMessageError(true);
      setPreviewUrl(null);
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function removePhoto() {
    if (uploading || removing) return;

    setRemoving(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile/photo", {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to remove picture."
        );
      }

      setPhotoUrl(null);
      setPreviewUrl(null);
      setMessage("Profile picture removed successfully.");
      setMessageError(false);

      router.refresh();
    } catch (err) {
      console.error("Remove photo error:", err);

      setMessage(
        err instanceof Error
          ? err.message
          : "Unable to remove profile picture."
      );

      setMessageError(true);
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        Loading your profile...
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <p className="text-red-400">
          {error || "Profile unavailable."}
        </p>

        <Link href="/login" className="mt-4 block text-emerald-400">
          Go to Login
        </Link>
      </main>
    );
  }

  const displayPhoto = previewUrl || photoUrl;
  const busy = uploading || removing;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/events"
          className="text-sm text-emerald-400 hover:underline"
        >
          ← Back to Events
        </Link>

        <h1 className="mt-8 text-3xl font-bold">
          My Profile
        </h1>

        {/* Profile Card */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8">

          {/* Profile Header */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-500 text-3xl font-bold text-slate-950">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Profile picture"
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(user.name)
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold capitalize">
                {user.name}
              </h2>

              <p className="mt-2 text-slate-400">
                {user.email}
              </p>

              <span className="mt-3 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                Sports Member
              </span>
            </div>
          </div>

          {/* Profile Picture Controls */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <h3 className="text-lg font-semibold">
              Profile Picture
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              JPG, PNG or WebP · Maximum 2 MB · Stored in MySQL
            </p>

            <div className="mt-5 space-y-3">
              <input
                ref={fileInputRef}
                id="profile-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) =>
                  chooseAndUploadPhoto(e.target.files?.[0])
                }
                className="sr-only"
              />

              <label
                htmlFor="profile-photo-input"
                aria-disabled={busy}
                className={`flex w-full items-center justify-center gap-3 rounded-lg border-2 border-emerald-400 bg-emerald-600 px-5 py-4 font-semibold text-white transition hover:bg-emerald-500 ${
                  busy
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }`}
              >
                <span aria-hidden="true">📷</span>

                {uploading
                  ? "Uploading Picture..."
                  : photoUrl
                    ? "Change Profile Picture"
                    : "Choose Profile Picture"}
              </label>

              {photoUrl && (
                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={busy}
                  className="w-full cursor-pointer rounded-lg border-2 border-red-500 px-5 py-3 font-semibold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {removing
                    ? "Removing Picture..."
                    : "Remove Profile Picture"}
                </button>
              )}
            </div>

            {message && (
              <p
                role="status"
                className={`mt-4 text-sm ${
                  messageError
                    ? "text-red-400"
                    : "text-emerald-400"
                }`}
              >
                {message}
              </p>
            )}
          </div>

          {/* Account Information */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <h3 className="text-lg font-semibold">
              Account Information
            </h3>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-800 p-4">
                <p className="text-sm text-slate-400">
                  Full Name
                </p>

                <p className="mt-2 font-medium capitalize">
                  {user.name}
                </p>
              </div>

              <div className="rounded-lg bg-slate-800 p-4">
                <p className="text-sm text-slate-400">
                  Email Address
                </p>

                <p className="mt-2 font-medium">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* My Sports Activities */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-xl font-bold">
              My Sports Activities
            </h3>

            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-400">
              {registeredEvents.length} Events
            </span>
          </div>

          {eventsLoading ? (
            <p className="mt-5 text-slate-400">
              Loading your events...
            </p>
          ) : eventsError ? (
            <p className="mt-5 text-red-400">
              {eventsError}
            </p>
          ) : registeredEvents.length === 0 ? (
            <div className="mt-6 rounded-lg bg-slate-800 p-6">
              <p className="text-slate-300">
                You haven't registered for any events yet.
              </p>

              <Link
                href="/events"
                className="mt-4 inline-block text-emerald-400 hover:underline"
              >
                Explore Events
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {registeredEvents.map((event) => (
                <div
                  key={event.event_id}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold capitalize text-emerald-400">
                      {event.sport_type}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        event.registration_status === "registered"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {event.registration_status}
                    </span>
                  </div>

                  <h4 className="mt-3 text-lg font-bold capitalize">
                    {event.event_title}
                  </h4>

                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <p>
                      Date:{" "}
                      {new Date(
                        `${event.event_date}T00:00:00`
                      ).toLocaleDateString("en-IN")}
                    </p>

                    <p className="capitalize">
                      Venue: {event.venue_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/events"
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Explore More Events
          </Link>
        </div>
      </div>
    </main>
  );
}
