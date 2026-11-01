"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type PhotoPreview = {
  file: File;
  url: string;
};

const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_PHOTO_BYTES = 20 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function SellPage() {
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([]);
  const [message, setMessage] = useState("");
  const photoPreviewsRef = useRef<PhotoPreview[]>([]);

  useEffect(() => {
    return () => {
      photoPreviewsRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, []);

  function removePhoto(index: number) {
    const preview = photoPreviews[index];
    if (preview) URL.revokeObjectURL(preview.url);
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
    const remainingPreviews = photoPreviews.filter((_, photoIndex) => photoIndex !== index);
    photoPreviewsRef.current = remainingPreviews;
    setPhotoPreviews(remainingPreviews);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");

    const form = e.currentTarget;
    const submission = new FormData(form);
    photos.forEach((photo) => submission.append("photos", photo, photo.name));

    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        body: submission,
      });
      const result = await response.json() as {
        vehicleId?: unknown;
        photoCount?: unknown;
        error?: unknown;
        details?: {
          message?: unknown;
          cleanupFailures?: Array<{ step?: unknown; message?: unknown }>;
        };
      };

      if (!response.ok) {
        const reason = typeof result.details?.message === "string"
          ? result.details.message
          : typeof result.error === "string"
            ? result.error
            : "Unable to submit the vehicle.";
        const cleanupMessage = result.details?.cleanupFailures?.length
          ? ` Cleanup issues: ${result.details.cleanupFailures.map((failure) => {
              const step = typeof failure.step === "string" ? failure.step : "cleanup";
              const detail = typeof failure.message === "string" ? failure.message : "unknown error";
              return `${step}: ${detail}`;
            }).join("; ")}`
          : "";
        setMessage(`Error: ${reason}${cleanupMessage}`);
        return;
      }

      if (typeof result.vehicleId !== "string" || result.photoCount !== photos.length) {
        setMessage("Error: The server response did not confirm the vehicle and all selected photos.");
        return;
      }

      setMessage("आपकी गाड़ी की जानकारी सफलतापूर्वक जमा हो गई है!");
      form.reset();
      photoPreviewsRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
      photoPreviewsRef.current = [];
      setPhotos([]);
      setPhotoPreviews([]);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Network error.";
      setMessage(`Error: Submission could not be confirmed. ${detail}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-[#0b1f3a] text-white">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
            Private vehicle listing
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Sell your vehicle
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            अपनी गाड़ी की जानकारी भरें और खरीदारों तक पहुँचें।
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        <form onSubmit={handleSubmit}>
          <fieldset disabled={loading} className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start gap-4 border-b border-slate-100 pb-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1f3a] text-sm font-semibold text-white">
                01
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[#0b1f3a] sm:text-xl">
                  Vehicle Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  गाड़ी की जानकारी और तस्वीरें साझा करें।
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="vehicle-photos"
                className="relative flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center transition hover:border-sky-700 hover:bg-sky-50/50 focus-within:ring-4 focus-within:ring-sky-100"
              >
                <input
                  id="vehicle-photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                    const selectedPhotos = Array.from(e.currentTarget.files || []);
                    e.currentTarget.value = "";

                    if (photos.length + selectedPhotos.length > MAX_PHOTOS) {
                      setMessage(`Error: Choose no more than ${MAX_PHOTOS} photos.`);
                      return;
                    }

                    const unsupportedPhoto = selectedPhotos.find((file) => !ALLOWED_PHOTO_TYPES.has(file.type));
                    if (unsupportedPhoto) {
                      setMessage("Error: Photos must be JPEG, PNG, or WebP images.");
                      return;
                    }

                    const oversizedPhoto = selectedPhotos.find((file) => file.size <= 0 || file.size > MAX_PHOTO_BYTES);
                    if (oversizedPhoto) {
                      setMessage("Error: Each photo must be between 1 byte and 5 MB.");
                      return;
                    }

                    const combinedSize = [...photos, ...selectedPhotos].reduce((total, file) => total + file.size, 0);
                    if (combinedSize > MAX_TOTAL_PHOTO_BYTES) {
                      setMessage("Error: The combined photo size must not exceed 20 MB.");
                      return;
                    }

                    setMessage("");
                    setPhotos((current) => [...current, ...selectedPhotos]);
                    const addedPreviews = selectedPhotos.map((file) => ({
                      file,
                      url: URL.createObjectURL(file),
                    }));
                    const nextPreviews = [...photoPreviewsRef.current, ...addedPreviews];
                    photoPreviewsRef.current = nextPreviews;
                    setPhotoPreviews(nextPreviews);
                  }}
                  disabled={loading || photos.length >= MAX_PHOTOS}
                  className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                />
                <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-white text-[#0b1f3a] shadow-sm ring-1 ring-slate-200">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
                    <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-[#0b1f3a]">
                  गाड़ी की फोटो अपलोड करें
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  JPEG, PNG, or WebP · up to 8 photos · 5 MB each
                </span>
                <span className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#0b1f3a] shadow-sm">
                  Choose photos
                </span>
                {photos.length > 0 && (
                  <span className="mt-3 max-w-full break-all text-xs font-medium text-sky-800">
                    {photos.length} {photos.length === 1 ? "photo" : "photos"} selected: {photos.map((photo) => photo.name).join(", ")}
                  </span>
                )}
              </label>
              {photoPreviews.length > 0 && (
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {photoPreviews.map(({ file, url }, index) => (
                    <li key={url} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <Image
                        src={url}
                        alt={file.name}
                        width={400}
                        height={300}
                        unoptimized
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <div className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="min-w-0 truncate text-xs font-medium text-slate-700" title={file.name}>
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          aria-label={`Remove ${file.name}`}
                          title="Remove photo"
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-200"
                        >
                          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
                            <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="vehicle-type" className="block text-sm font-medium text-slate-700">Vehicle Type</label>
                <select id="vehicle-type" name="vehicle_type" required className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-700 focus:ring-4 focus:ring-sky-100">
                  <option value="">Select Vehicle</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Truck">Truck</option>
                  <option value="Bus">Bus</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="brand" className="block text-sm font-medium text-slate-700">Brand</label>
                <input id="brand" name="brand" required placeholder="e.g. Maruti" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-700 focus:ring-4 focus:ring-sky-100" />
              </div>

              <div className="space-y-2">
                <label htmlFor="model" className="block text-sm font-medium text-slate-700">Model</label>
                <input id="model" name="model" required placeholder="e.g. Swift" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-700 focus:ring-4 focus:ring-sky-100" />
              </div>

              <div className="space-y-2">
                <label htmlFor="manufacturing-year" className="block text-sm font-medium text-slate-700">Manufacturing Year</label>
                <input id="manufacturing-year" name="manufacturing_year" type="number" min="1900" max="2026" required className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-700 focus:ring-4 focus:ring-sky-100" />
              </div>

              <div className="space-y-2">
                <label htmlFor="km-driven" className="block text-sm font-medium text-slate-700">Kilometers Driven</label>
                <input id="km-driven" name="km_driven" type="number" min="0" required className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-700 focus:ring-4 focus:ring-sky-100" />
              </div>

              <div className="space-y-2">
                <label htmlFor="fuel-type" className="block text-sm font-medium text-slate-700">Fuel Type</label>
                <select id="fuel-type" name="fuel_type" required className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-700 focus:ring-4 focus:ring-sky-100">
                  <option value="">Select Fuel</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="expected-price" className="block text-sm font-medium text-slate-700">Expected Price (₹)</label>
                <input id="expected-price" name="expected_price" type="number" min="1" required className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-700 focus:ring-4 focus:ring-sky-100" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-start gap-4 border-b border-slate-100 pb-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1f3a] text-sm font-semibold text-white">
                02
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[#0b1f3a] sm:text-xl">
                  Seller Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  खरीदारों के संपर्क के लिए अपनी जानकारी दें।
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="city" className="block text-sm font-medium text-slate-700">City</label>
                <input id="city" name="city" required placeholder="e.g. Jodhpur" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-700 focus:ring-4 focus:ring-sky-100" />
              </div>

              <div className="space-y-2">
                <label htmlFor="state" className="block text-sm font-medium text-slate-700">State</label>
                <input id="state" name="state" required placeholder="e.g. Rajasthan" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-700 focus:ring-4 focus:ring-sky-100" />
              </div>

              <div className="space-y-2">
                <label htmlFor="seller-name" className="block text-sm font-medium text-slate-700">Seller Name</label>
                <input id="seller-name" name="seller_name" required className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-700 focus:ring-4 focus:ring-sky-100" />
              </div>

              <div className="space-y-2">
                <label htmlFor="seller-phone" className="block text-sm font-medium text-slate-700">Mobile Number</label>
                <input id="seller-phone" name="seller_phone" type="tel" pattern="[0-9]{10}" required placeholder="10 digit mobile number" className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-700 focus:ring-4 focus:ring-sky-100" />
              </div>
            </div>
          </section>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b1f3a] px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#15345b] focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Uploading photos and submitting..." : "Submit Vehicle"}
              {!loading && (
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
                  <path d="M4 10h12m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            {message && (
              <p role="status" aria-live="polite" className={`mt-4 break-words rounded-lg px-4 py-3 text-center text-sm font-medium ${message.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
                {message}
              </p>
            )}
          </div>
          </fieldset>
        </form>
      </div>
    </main>
  );
}