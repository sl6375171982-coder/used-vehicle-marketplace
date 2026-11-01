"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import VehiclePhoto from "@/components/VehiclePhoto";
import type { PublicVehiclePhoto } from "@/lib/public-vehicle-photos";
import { getSafeVehicleImageUrl } from "@/lib/vehicle-images";

export default function VehicleGallery({
  photos,
  alt,
  href,
  variant = "detail",
  sizes,
}: {
  photos: PublicVehiclePhoto[];
  alt: string;
  href?: string;
  variant?: "card" | "detail";
  sizes?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeIndex = selectedIndex < photos.length ? selectedIndex : 0;
  const selectedPhoto = photos[activeIndex];
  const isCard = variant === "card";

  const mainPhoto = selectedPhoto ? (
    <VehiclePhoto
      key={selectedPhoto.id}
      imageUrl={selectedPhoto.image_url}
      alt={alt}
      className={isCard ? "aspect-[4/3] bg-slate-100" : "aspect-[16/10] rounded-3xl"}
      sizes={sizes}
    />
  ) : (
    <VehiclePhoto
      imageUrl={null}
      alt={alt}
      className={isCard ? "aspect-[4/3] bg-slate-100" : "aspect-[16/10] rounded-3xl"}
      sizes={sizes}
    />
  );

  return (
    <div className="min-w-0">
      {href ? (
        <Link href={href} className="block overflow-hidden focus:outline-none focus:ring-4 focus:ring-blue-200">
          {mainPhoto}
        </Link>
      ) : (
        mainPhoto
      )}

      {photos.length > 1 && (
        <div
          className={`market-scrollbar-hide mt-2 flex gap-2 overflow-x-auto ${isCard ? "px-0.5 pb-0.5" : "mt-3 gap-3 pb-1"}`}
          aria-label="Vehicle photos"
        >
          {photos.map((photo, index) => {
            const safeThumbnailUrl = getSafeVehicleImageUrl(photo.image_url);
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`Show photo ${index + 1} of ${photos.length}`}
                aria-pressed={activeIndex === index}
                className={`relative shrink-0 overflow-hidden rounded-lg border-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeIndex === index ? "border-blue-700" : "border-transparent opacity-75 hover:opacity-100"
                } ${isCard ? "size-12 sm:size-14" : "size-[4.5rem] sm:size-20"}`}
              >
                {safeThumbnailUrl ? (
                  <Image
                    src={safeThumbnailUrl}
                    alt={`${alt} thumbnail ${index + 1}`}
                    fill
                    unoptimized
                    sizes={isCard ? "56px" : "80px"}
                    className="object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-100 text-[10px] text-slate-500">
                    Unavailable
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {photos.length > 1 && (
        <p className={`mt-1 text-[11px] font-medium text-slate-500 ${isCard ? "px-0.5" : ""}`}>
          Photo {activeIndex + 1} of {photos.length}
        </p>
      )}
    </div>
  );
}
