"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VehicleGallery from "@/components/VehicleGallery";
import VehicleInquiryForm from "@/components/VehicleInquiryForm";
import { supabase } from "@/lib/supabase";
import { mapPublicVehicle, publicVehicleSelectFields, type Vehicle } from "@/lib/vehicle";
import { loadApprovedVehiclePhotos, type PublicVehiclePhoto } from "@/lib/public-vehicle-photos";

function formatPrice(price: number) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

export default function VehicleDetails({ vehicleId }: { vehicleId: string }) {
  const [result, setResult] = useState<{
    vehicleId: string;
    vehicle: Vehicle | null;
    photos: PublicVehiclePhoto[];
    error: string;
    photoError: string;
  } | null>(null);
  const [showInquiry, setShowInquiry] = useState(false);
  const loading = !result || result.vehicleId !== vehicleId;
  const vehicle = loading ? null : result.vehicle;
  const error = loading ? "" : result.error;
  const photoError = loading ? "" : result.photoError;

  useEffect(() => {
    let active = true;

    async function loadVehicle() {
      const { data, error: loadError } = await supabase
        .from("public_vehicles")
        .select(publicVehicleSelectFields)
        .eq("id", vehicleId)
        .maybeSingle();
      if (!active) return;

      if (loadError || !data) {
        setResult({
          vehicleId,
          vehicle: null,
          photos: [],
          error: loadError ? `${loadError.code}: ${loadError.message}` : "",
          photoError: "",
        });
        return;
      }

      const photoResult = await loadApprovedVehiclePhotos(supabase, [data.id]);
      if (!active) return;

      setResult({
        vehicleId,
        vehicle: mapPublicVehicle(data, photoResult.photosByVehicleId.get(data.id)?.[0]),
        photos: photoResult.photosByVehicleId.get(data.id) || [],
        error: "",
        photoError: photoResult.error || "",
      });
    }

    void loadVehicle();
    return () => {
      active = false;
    };
  }, [vehicleId]);

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <Link href="/" className="text-xl font-black tracking-tight text-[#0b1f3a] sm:text-2xl">
            Vehicle<span className="text-blue-600">Market.</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-slate-600 transition hover:text-blue-700">← Browse vehicles</Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
          <Link href="/" className="transition hover:text-blue-700">Home</Link>
          <span className="mx-2">/</span>
          <span>Vehicle details</span>
        </nav>

        {loading && <div className="h-[420px] animate-pulse rounded-3xl bg-slate-200" />}
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800">Unable to load vehicle: {error}</p>}
        {!loading && !error && !vehicle && (
          <section className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center">
            <h1 className="text-2xl font-black text-[#0b1f3a]">Vehicle not found</h1>
            <p className="mt-2 text-slate-500">This listing may no longer be available.</p>
            <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#0b1f3a] px-5 font-bold text-white">Browse vehicles</Link>
          </section>
        )}

        {vehicle && (
          <>
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <VehicleGallery
                  key={vehicle.id}
                  photos={loading ? [] : result?.photos || []}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  variant="detail"
                  sizes="(max-width: 1024px) 100vw, 65vw"
                />
                {photoError && <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Some vehicle photos could not be loaded: {photoError}</p>}
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Vehicle overview</p>
                  <h2 className="mt-2 text-xl font-black text-[#0b1f3a]">At a glance</h2>
                  <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {[
                      ["Vehicle type", vehicle.vehicle_type],
                      ["Brand", vehicle.brand],
                      ["Model", vehicle.model],
                      ["Year", String(vehicle.manufacturing_year)],
                      ["Kilometers driven", `${Number(vehicle.km_driven).toLocaleString("en-IN")} km`],
                      ["Fuel type", vehicle.fuel_type || "Not specified"],
                      ["City", vehicle.city],
                      ["State", vehicle.state],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-slate-50 p-3.5">
                        <dt className="text-xs font-medium text-slate-500">{label}</dt>
                        <dd className="mt-1 break-words text-sm font-bold text-slate-800">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-8">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-800">{vehicle.vehicle_type}</span>
                <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#0b1f3a] sm:text-4xl">{vehicle.brand} {vehicle.model}</h1>
                <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4 text-blue-700">
                    <path d="M16 8.3c0 4.2-6 9-6 9s-6-4.8-6-9a6 6 0 1 1 12 0Z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  {vehicle.city}, {vehicle.state}
                </p>
                <p className="mt-8 border-y border-slate-100 py-6 text-3xl font-black text-blue-900">{formatPrice(vehicle.expected_price)}</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">Model year</p>
                    <p className="mt-1 font-bold text-slate-800">{vehicle.manufacturing_year}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">Odometer</p>
                    <p className="mt-1 font-bold text-slate-800">{Number(vehicle.km_driven).toLocaleString("en-IN")} km</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInquiry(true)}
                  className="mt-7 min-h-13 w-full rounded-xl bg-[#0b1f3a] px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-950/10 transition hover:bg-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                  Buy For Query
                </button>
                <p className="mt-4 text-center text-xs leading-5 text-slate-500">Your phone number is only shared with the marketplace team to respond to your inquiry.</p>
              </aside>
            </div>

            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
              <h2 className="font-bold text-[#0b1f3a]">Private, safe contact</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Seller and buyer phone numbers are never displayed on public vehicle listings. Send an inquiry to request a follow-up.</p>
            </div>
          </>
        )}
      </div>

      {showInquiry && vehicle && <VehicleInquiryForm vehicle={vehicle} onClose={() => setShowInquiry(false)} />}
    </main>
  );
}
