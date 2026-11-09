
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EventAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
