"use client";

import Image from "next/image";
import { useState } from "react";
import { getSafeVehicleImageUrl } from "@/lib/vehicle-images";

export default function VehiclePhoto({
  imageUrl,
  alt,
  className = "",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  unavailable = false,
}: {
  imageUrl: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  unavailable?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const safeImageUrl = getSafeVehicleImageUrl(imageUrl);

  if (unavailable || (imageUrl?.trim() && (!safeImageUrl || failed))) {
    return (
      <div className={`flex aspect-[16/10] flex-col items-center justify-center gap-2 bg-slate-100 px-4 text-center text-slate-500 ${className}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-8">
          <path d="M12 8v4m0 4h.01M10.3 3.8 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.2a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-semibold">{unavailable ? "Photo temporarily unavailable" : "Photo could not be loaded"}</span>
      </div>
    );
  }

  if (!safeImageUrl) {
    return (
      <div className={`flex aspect-[16/10] items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-10">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="9" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="m5 17 4-4 3 3 3-4 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative aspect-[16/10] overflow-hidden bg-slate-100 ${className}`}>
      <Image
        src={safeImageUrl}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized
        onError={() => setFailed(true)}
        className="object-cover transition duration-500 group-hover:scale-[1.03]"
      />
    </div>
  );
}
