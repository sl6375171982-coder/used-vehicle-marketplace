"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { mapPublicVehicle, publicVehicleSelectFields, type Vehicle } from "@/lib/vehicle";
import VehicleGallery from "@/components/VehicleGallery";
import VehicleInquiryForm from "@/components/VehicleInquiryForm";
import { loadApprovedVehiclePhotos, type PublicVehiclePhoto } from "@/lib/public-vehicle-photos";

const categories = ["All", "Car", "Bike", "Scooter", "Truck", "Bus", "Pickup", "Commercial", "Other"];

type Listing = Vehicle & {
  photos: PublicVehiclePhoto[];
};

type VehicleCardProps = {
  vehicle: Listing;
  favorite: boolean;
  onFavorite: () => void;
  onInquiry: () => void;
};

function formatPrice(price: number) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

function Icon({
  name,
  className = "size-5",
}: {
  name: "search" | "pin" | "heart" | "home" | "grid" | "sell" | "user" | "arrow" | "spark";
  className?: string;
}) {
  const paths = {
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></>,
    heart: <path d="M20.4 8.8c0 4.1-8.4 10-8.4 10S3.6 12.9 3.6 8.8a4.4 4.4 0 0 1 8.4-1.7 4.4 4.4 0 0 1 8.4 1.7Z" />,
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    sell: <><path d="M12 20V4m-6 6 6-6 6 6" /><path d="M4 20h16" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    arrow: <><path d="M4 12h16" /><path d="m13 5 7 7-7 7" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  );
}

function VehicleCard({ vehicle, favorite, onFavorite, onInquiry }: VehicleCardProps) {
  return (
    <article className="group w-[78%] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(15,23,42,0.12)] sm:w-auto sm:max-w-none">
      <div className="relative">
        <VehicleGallery
          photos={vehicle.photos}
          alt={`${vehicle.brand} ${vehicle.model}`}
          href={`/vehicles/${encodeURIComponent(vehicle.id)}`}
          variant="card"
          sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 340px"
        />
        <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-700 shadow-sm">
          {vehicle.vehicle_type}
        </span>
        <button
          type="button"
          onClick={onFavorite}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={favorite}
          className={`absolute right-3 top-3 flex size-9 items-center justify-center rounded-full shadow-sm backdrop-blur transition ${favorite ? "bg-rose-50 text-rose-600" : "bg-white/95 text-slate-600 hover:text-rose-500"}`}
        >
          <Icon name="heart" className={`size-[18px] ${favorite ? "fill-rose-500" : ""}`} />
        </button>
      </div>

      <div className="p-3.5 sm:p-4">
        <Link href={`/vehicles/${encodeURIComponent(vehicle.id)}`} className="block">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">{vehicle.brand}</p>
          <h3 className="mt-1 truncate text-base font-bold tracking-tight text-slate-900">{vehicle.brand} {vehicle.model}</h3>
          <p className="mt-2 text-xl font-black tracking-tight text-[#102b4e]">{formatPrice(vehicle.expected_price)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500">
            <span>{vehicle.manufacturing_year}</span><span className="text-slate-300">•</span>
            <span>{Number(vehicle.km_driven).toLocaleString("en-IN")} km</span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 truncate text-xs font-medium text-slate-500">
            <Icon name="pin" className="size-3.5 shrink-0 text-slate-400" />
            {vehicle.city}{vehicle.state ? `, ${vehicle.state}` : ""}
          </p>
        </Link>
        <button
          type="button"
          onClick={onInquiry}
          className="mt-3.5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#102b4e] px-3 text-xs font-bold text-white transition hover:bg-[#1b426e] focus:outline-none focus:ring-4 focus:ring-blue-200"
        >
          Buy For Query <Icon name="arrow" className="size-4" />
        </button>
      </div>
    </article>
  );
}

export default function Home() {
  const [vehicles, setVehicles] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("All");
  const [city, setCity] = useState("All");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [inquiryVehicle, setInquiryVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    let active = true;

    async function loadVehicles() {
      const { data, error: loadError } = await supabase
        .from("public_vehicles")
        .select(publicVehicleSelectFields)
        .order("created_at", { ascending: false });

      if (!active) return;
      if (loadError) {
        setError(`${loadError.code}: ${loadError.message}`);
        setLoading(false);
        return;
      }

      const listings = data || [];
      const photoResult = await loadApprovedVehiclePhotos(
        supabase,
        listings.map((vehicle) => vehicle.id)
      );

      if (!active) return;
      if (photoResult.error) setPhotoError(photoResult.error);
      setVehicles(listings.map((vehicle) => {
        const photos = photoResult.photosByVehicleId.get(vehicle.id) || [];
        return {
          ...mapPublicVehicle(vehicle, photos[0]),
          photos,
        };
      }));
      setLoading(false);
    }

    void loadVehicles();
    return () => {
      active = false;
    };
  }, []);

  const brands = useMemo(
    () => [...new Set(vehicles.map((vehicle) => vehicle.brand).filter(Boolean))].sort(),
    [vehicles]
  );
  const cities = useMemo(
    () => [...new Set(vehicles.map((vehicle) => vehicle.city).filter(Boolean))].sort(),
    [vehicles]
  );
  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    const min = minimumPrice === "" ? null : Number(minimumPrice);
    const max = maximumPrice === "" ? null : Number(maximumPrice);

    return vehicles.filter((vehicle) => {
      const matchesCategory = category === "All" || vehicle.vehicle_type.toLowerCase() === category.toLowerCase();
      const matchesBrand = brand === "All" || vehicle.brand === brand;
      const matchesCity = city === "All" || vehicle.city === city;
      const searchableText = `${vehicle.brand} ${vehicle.model} ${vehicle.city} ${vehicle.state} ${vehicle.vehicle_type}`.toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesMinimum = min === null || vehicle.expected_price >= min;
      const matchesMaximum = max === null || vehicle.expected_price <= max;
      const matchesFavorite = !favoritesOnly || favorites.includes(vehicle.id);

      return matchesCategory && matchesBrand && matchesCity && matchesSearch && matchesMinimum && matchesMaximum && matchesFavorite;
    });
  }, [vehicles, category, brand, city, minimumPrice, maximumPrice, search, favoritesOnly, favorites]);

  const recentlyAdded = filteredVehicles.slice(0, 6);
  const trending = [...filteredVehicles]
    .sort((first, second) => first.expected_price - second.expected_price)
    .slice(0, 6);
  const recommended = [...filteredVehicles]
    .sort((first, second) => {
      const firstMatch = Number(first.city === city && city !== "All") + Number(first.vehicle_type === category && category !== "All");
      const secondMatch = Number(second.city === city && city !== "All") + Number(second.vehicle_type === category && category !== "All");
      return secondMatch - firstMatch || first.expected_price - second.expected_price;
    })
    .slice(0, 8);

  function toggleFavorite(vehicleId: string) {
    setFavorites((current) => current.includes(vehicleId)
      ? current.filter((id) => id !== vehicleId)
      : [...current, vehicleId]);
  }

  function selectCategory(value: string) {
    setCategory(value);
    setFavoritesOnly(false);
    document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" });
  }

  const categoryIcons: Record<string, string> = {
    All: "✦", Car: "🚘", Bike: "🏍️", Scooter: "🛵", Truck: "🚚",
    Bus: "🚌", Pickup: "🛻", Commercial: "🚐", Other: "✧",
  };

  function renderCards(items: Listing[]) {
    return items.map((vehicle) => (
      <VehicleCard
        key={vehicle.id}
        vehicle={vehicle}
        favorite={favorites.includes(vehicle.id)}
        onFavorite={() => toggleFavorite(vehicle.id)}
        onInquiry={() => setInquiryVehicle(vehicle)}
      />
    ));
  }

  function renderSection(title: string, subtitle: string, items: Listing[], id?: string) {
    return (
      <section id={id} className="scroll-mt-32">
        <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#174c79] hover:text-[#102b4e]"
          >
            View all <Icon name="arrow" className="size-3.5" />
          </button>
        </div>
        {items.length > 0 ? (
          <div className="market-scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
            {renderCards(items)}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-9 text-center text-sm text-slate-500">
            {favoritesOnly ? "No saved vehicles match these filters yet." : "No approved vehicles match these filters yet."}
          </p>
        )}
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] pb-24 text-slate-950 sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-[0_2px_12px_rgba(15,23,42,0.04)] backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 pb-3 pt-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="shrink-0 text-[19px] font-black tracking-tight text-[#102b4e] sm:text-2xl">
              Vehicle<span className="text-orange-500">Market</span><span className="text-orange-500">.</span>
            </Link>
            <label className="hidden min-h-10 w-full max-w-[190px] items-center gap-2 rounded-xl bg-slate-50 px-3 text-slate-500 sm:flex lg:mr-auto lg:ml-5">
              <Icon name="pin" className="size-4 shrink-0 text-orange-500" />
              <span className="sr-only">Select location</span>
              <select value={city} onChange={(event) => setCity(event.target.value)} className="w-full truncate bg-transparent text-xs font-semibold text-slate-700 outline-none">
                <option value="All">All locations</option>
                {cities.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <Link href="/sell" className="hidden min-h-10 items-center gap-2 rounded-xl bg-[#102b4e] px-4 text-xs font-bold text-white transition hover:bg-[#1b426e] sm:inline-flex">
              <Icon name="sell" className="size-4" /> Sell vehicle
            </Link>
            <Link href="/admin" className="hidden size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 sm:flex" aria-label="Profile">
              <Icon name="user" className="size-[18px]" />
            </Link>
          </div>

          <label className="mt-3 flex min-h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-[#f7f8fa] px-3.5 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-100 sm:mt-3">
            <Icon name="search" className="size-[18px] shrink-0 text-slate-400" />
            <span className="sr-only">Search vehicles</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cars, bikes, brands..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {search && <button type="button" onClick={() => setSearch("")} className="text-xs font-bold text-slate-400 hover:text-slate-700">Clear</button>}
          </label>

          <label className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 sm:hidden">
            <Icon name="pin" className="size-3.5 text-orange-500" />
            <span>Delivering to</span>
            <span className="sr-only">Select location</span>
            <select value={city} onChange={(event) => setCity(event.target.value)} className="max-w-[65vw] truncate bg-transparent font-bold text-slate-800 outline-none">
              <option value="All">All locations</option>
              {cities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </header>

      <div className="mx-auto max-w-7xl">
        <section id="categories" className="market-scrollbar-hide flex scroll-mt-28 snap-x gap-2 overflow-x-auto px-4 py-3 sm:gap-3 sm:px-6 lg:px-8">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => selectCategory(item)}
              aria-pressed={category === item}
              className={`flex min-w-[72px] snap-start flex-col items-center gap-1.5 rounded-2xl px-3 py-2 text-[11px] font-bold transition sm:min-w-[88px] sm:py-3 ${category === item ? "bg-[#102b4e] text-white shadow-md shadow-blue-950/15" : "bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-700"}`}
            >
              <span aria-hidden="true" className="text-[20px] leading-6">{categoryIcons[item]}</span>
              {item === "All" ? "Explore" : item}
            </button>
          ))}
        </section>

        <section className="px-4 pb-5 pt-1 sm:px-6 sm:pb-7 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-[#102b4e] via-[#174c79] to-[#257a91] px-5 py-6 text-white shadow-[0_16px_40px_rgba(16,43,78,0.2)] sm:min-h-[235px] sm:px-9 sm:py-8 lg:px-12">
            <div aria-hidden="true" className="absolute -right-10 -top-20 size-64 rounded-full border border-white/10 sm:right-16 sm:size-80" />
            <div aria-hidden="true" className="absolute -right-2 top-10 size-40 rounded-full border border-white/10 sm:right-48 sm:top-16 sm:size-48" />
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-blue-50">
                <Icon name="spark" className="size-3.5" /> Your next ride starts here
              </span>
              <h1 className="mt-4 max-w-md text-[27px] font-black leading-[1.08] tracking-tight sm:mt-5 sm:text-4xl lg:text-[42px]">
                Find a ride that feels like <span className="text-orange-300">yours.</span>
              </h1>
              <p className="mt-2 max-w-sm text-xs leading-5 text-blue-100 sm:mt-3 sm:text-sm sm:leading-6">
                Explore approved vehicles from real sellers, all in one place.
              </p>
              <button
                type="button"
                onClick={() => document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" })}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-orange-400 px-4 text-xs font-extrabold text-[#182b3c] shadow-lg shadow-orange-950/15 transition hover:bg-orange-300 sm:mt-5 sm:min-h-11 sm:px-5 sm:text-sm"
              >
                Explore vehicles <Icon name="arrow" className="size-4" />
              </button>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-5 right-1 top-4 flex w-[40%] items-center justify-center opacity-20 sm:right-12 sm:w-[38%] sm:opacity-40">
              <svg viewBox="0 0 360 170" fill="none" className="w-full max-w-[390px] text-white">
                <path d="m38 105 16-34c4-8 12-13 22-13h139c10 0 18 5 23 13l23 34h36c8 0 14 6 14 14v16H24v-16c0-8 6-14 14-14Z" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
                <path d="m77 61 14 44h133l-24-44H91M40 112h35m206 0h28" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
                <circle cx="95" cy="136" r="21" fill="#174c79" stroke="currentColor" strokeWidth="5" />
                <circle cx="252" cy="136" r="21" fill="#174c79" stroke="currentColor" strokeWidth="5" />
                <circle cx="95" cy="136" r="6" fill="currentColor" /><circle cx="252" cy="136" r="6" fill="currentColor" />
              </svg>
            </div>
          </div>
        </section>

        <div className="space-y-8 px-4 pb-8 sm:space-y-11 sm:px-6 lg:px-8">
          {error && <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Unable to load vehicles: {error}</p>}
          {photoError && <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Some vehicle photos could not be loaded: {photoError}</p>}

          {loading ? (
            <section aria-label="Loading approved vehicles" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-[300px] animate-pulse rounded-[1.35rem] bg-slate-200 sm:h-[370px]" />)}
            </section>
          ) : !error && (
            <>
              {renderSection("Trending vehicles", "Good finds from approved listings", trending, "trending")}
              {renderSection(favoritesOnly ? "Your favorites" : "Recommended for you", "Thoughtful picks from vehicles available now", recommended, "browse")}
              {renderSection("Recently added", "The latest approved vehicles on the marketplace", recentlyAdded, "recent")}
            </>
          )}

          {!loading && !error && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 sm:text-lg">Refine your search</h2>
                  <p className="mt-1 text-xs text-slate-500">{filteredVehicles.length} approved {filteredVehicles.length === 1 ? "vehicle" : "vehicles"} available</p>
                </div>
                {(brand !== "All" || minimumPrice || maximumPrice) && (
                  <button type="button" onClick={() => { setBrand("All"); setMinimumPrice(""); setMaximumPrice(""); }} className="text-xs font-bold text-orange-700 hover:text-orange-800">
                    Clear filters
                  </button>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                <label>
                  <span className="sr-only">Brand</span>
                  <select value={brand} onChange={(event) => setBrand(event.target.value)} className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                    <option value="All">All brands</option>
                    {brands.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span className="sr-only">Minimum price</span>
                  <input type="number" min="0" value={minimumPrice} onChange={(event) => setMinimumPrice(event.target.value)} placeholder="Min price ₹" className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                </label>
                <label>
                  <span className="sr-only">Maximum price</span>
                  <input type="number" min="0" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} placeholder="Max price ₹" className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                </label>
                <button type="button" onClick={() => { setCategory("All"); setBrand("All"); setCity("All"); setSearch(""); setMinimumPrice(""); setMaximumPrice(""); setFavoritesOnly(false); }} className="min-h-10 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-200">
                  Reset all
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      <footer className="hidden border-t border-slate-200 bg-white px-5 py-7 text-center sm:block">
        <Link href="/" className="text-lg font-black text-[#102b4e]">Vehicle<span className="text-orange-500">Market.</span></Link>
        <p className="mt-1 text-xs text-slate-500">Your marketplace. Your next journey.</p>
      </footer>

      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/90 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.45rem)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          <button type="button" onClick={() => { setFavoritesOnly(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#174c79]">
            <Icon name="home" className="size-[19px]" /> Home
          </button>
          <button type="button" onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-slate-500">
            <Icon name="grid" className="size-[19px]" /> Categories
          </button>
          <Link href="/sell" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-slate-500">
            <Icon name="sell" className="size-[19px]" /> Sell
          </Link>
          <button type="button" onClick={() => { setFavoritesOnly(true); document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" }); }} className={`relative flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${favoritesOnly ? "text-rose-600" : "text-slate-500"}`}>
            <Icon name="heart" className={`size-[19px] ${favoritesOnly ? "fill-rose-100" : ""}`} /> Favorites
            {favorites.length > 0 && <span className="absolute right-4 top-1 flex size-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">{favorites.length}</span>}
          </button>
          <Link href="/admin" className="flex min-h-12 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-slate-500">
            <Icon name="user" className="size-[19px]" /> Profile
          </Link>
        </div>
      </nav>

      {inquiryVehicle && <VehicleInquiryForm vehicle={inquiryVehicle} onClose={() => setInquiryVehicle(null)} />}
    </main>
  );
}
