
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  user_id: number;
  name: string;
  email: string;
  has_photo: number;
}

export default function AuthNav() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        setPhotoUrl(null);
        return;
      }

      const data = await response.json();
      const currentUser: User | null = data.authenticated
        ? data.user
        : null;

      setUser(currentUser);

      if (currentUser?.has_photo) {
        const photoResponse = await fetch("/api/profile/photo", {
          cache: "no-store",
        });

        if (photoResponse.ok && photoResponse.status === 200) {
          const blob = await photoResponse.blob();
          setPhotoUrl(URL.createObjectURL(blob));
        } else {
          setPhotoUrl(null);
        }
      } else {
        setPhotoUrl(null);
      }
    } catch (error) {
      console.error("Unable to load navigation user:", error);
      setUser(null);
      setPhotoUrl(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser, pathname]);

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      setPhotoUrl(null);

      router.push("/login");
      router.refresh();
    } catch {
      alert("Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <span className="text-sm text-slate-400">
        Loading...
      </span>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm text-slate-300 hover:text-white"
        >
          Login
        </Link>

        <Link
          href="/signup"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/profile"
        className="flex items-center gap-3 rounded-lg hover:opacity-80"
        title="View My Profile"
      >
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-emerald-500 font-bold text-slate-950">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile picture"
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <span className="text-sm font-medium text-emerald-400">
          Hi, {user.name}
        </span>
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="cursor-pointer rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-50"
      >
        {loggingOut ? "Logging out..." : "Logout"}
      </button>
    </div>
  );
}
