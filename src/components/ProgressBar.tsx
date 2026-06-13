"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When the path changes, show the bar briefly then hide it
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] h-1 overflow-hidden">
      <div className="h-full bg-primary animate-progress-bar shadow-[0_0_10px_#11b3f5]" />
      <style jsx>{`
        @keyframes progress-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-30%); }
          100% { transform: translateX(0%); }
        }
        .animate-progress-bar {
          animation: progress-bar 0.8s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}
