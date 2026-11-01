"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import VehiclePhoto from "@/components/VehiclePhoto";
import { supabase } from "../../lib/supabase";
import type { Vehicle as PublicVehicle } from "@/lib/vehicle";

type Vehicle = PublicVehicle & {
  seller_name: string;
  seller_phone: string;
  status: string;
};

type Inquiry = {
  id: string;
  vehicle_id: string;
  buyer_name: string;
  buyer_phone: string;
  message: string | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
};

type AdminPhoto = {
  id: string;
  vehicle_id: string;
  storage_path: string;
  sort_order: number;
  image_url: string | null;
};

type PhotoPreview = {
  imageUrl: string;
  alt: string;
  label: string;
};

type IconName = "grid" | "vehicle" | "clock" | "check" | "logout" | "edit" | "image" | "arrow" | "close";

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      {name === "grid" && (
        <>
          <rect x="3.75" y="3.75" width="6.25" height="6.25" rx="1" stroke="currentColor" strokeWidth="1.7" />
          <rect x="14" y="3.75" width="6.25" height="6.25" rx="1" stroke="currentColor" strokeWidth="1.7" />
          <rect x="3.75" y="14" width="6.25" height="6.25" rx="1" stroke="currentColor" strokeWidth="1.7" />
          <rect x="14" y="14" width="6.25" height="6.25" rx="1" stroke="currentColor" strokeWidth="1.7" />
        </>
      )}
      {name === "vehicle" && (
        <>
          <path d="m5 11 1.5-4h11L19 11l1.5 1.5v5h-2v-2h-13v2h-2v-5L5 11Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M6.5 11h11M7 14h.01M17 14h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 7.5v5l3 1.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === "check" && <path d="m5 12.5 4.25 4.25L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
      {name === "logout" && (
        <>
          <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M14 8l4 4-4 4M18 12H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === "edit" && (
        <>
          <path d="m14.5 5.5 4 4M5 19l3.75-.75L19 8a2.12 2.12 0 0 0-3-3L5.75 15.25 5 19Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === "image" && (
        <>
          <rect x="3.75" y="4.75" width="16.5" height="14.5" rx="1.75" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="9" cy="9.5" r="1.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="m5 17 4.25-4.25 2.5 2.5 2.75-3 4.5 4.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === "arrow" && <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />}
      {name === "close" && <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />}
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  const styles = normalizedStatus === "pending"
    ? "border-amber-200 bg-amber-50 text-amber-800"
    : normalizedStatus === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : normalizedStatus === "rejected"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {status || "Unknown"}
    </span>
  );
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclePhotos, setVehiclePhotos] = useState<AdminPhoto[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [message, setMessage] = useState("");
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<PhotoPreview | null>(null);

  const loadVehicles = useCallback(async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Vehicles load error: " + error.message);
      return;
    }

    setVehicles((data || []) as Vehicle[]);

    const vehicleIds = (data || []).map((vehicle) => vehicle.id);
    if (vehicleIds.length === 0) {
      setVehiclePhotos([]);
      return;
    }

    const { data: photos, error: photosError } = await supabase
      .from("vehicle_photos")
      .select("id,vehicle_id,storage_path,sort_order")
      .in("vehicle_id", vehicleIds)
      .order("sort_order", { ascending: true });

    if (photosError) {
      setVehiclePhotos([]);
      setMessage("Vehicle photos load error: " + photosError.message);
      return;
    }

    const signedPhotos = await Promise.all((photos || []).map(async (photo) => {
      const { data: signedUrl, error: signedUrlError } = await supabase.storage
        .from("vehicle-photos-private")
        .createSignedUrl(photo.storage_path, 300);

      if (signedUrlError) {
        return { ...photo, image_url: null, previewError: signedUrlError.message };
      }
      return { ...photo, image_url: signedUrl.signedUrl, previewError: null };
    }));

    setVehiclePhotos(signedPhotos.map((photo) => ({
      id: photo.id,
      vehicle_id: photo.vehicle_id,
      storage_path: photo.storage_path,
      sort_order: photo.sort_order,
      image_url: photo.image_url,
    })));
    const previewError = signedPhotos.find((photo) => photo.previewError)?.previewError;
    if (previewError) setMessage("A vehicle photo preview could not be loaded: " + previewError);
  }, []);

  const loadInquiries = useCallback(async () => {
    const { data, error } = await supabase
      .from("vehicle_inquiries")
      .select("id,vehicle_id,buyer_name,buyer_phone,message,status,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Inquiries load error: " + error.message);
      return;
    }

    setInquiries((data || []) as Inquiry[]);
  }, []);

  const verifyAdmin = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      setAdmin(false);
      setMessage("यह account Admin नहीं है।");
      return;
    }

    setAdmin(true);
    setMessage("");
    await Promise.all([loadVehicles(), loadInquiries()]);
  }, [loadInquiries, loadVehicles]);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        await verifyAdmin(data.session.user.id);
      }

      setLoading(false);
    }

    checkSession();
  }, [verifyAdmin]);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Login हो रहा है...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setMessage(error?.message || "Login failed");
      return;
    }

    await verifyAdmin(data.user.id);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from("vehicles")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage("Update error: " + error.message);
      return;
    }

    setMessage("Vehicle status updated.");
    await loadVehicles();
  }

  async function changePrice(vehicle: Vehicle) {
    const newPrice = window.prompt(
      "नई कीमत डालें:",
      String(vehicle.expected_price)
    );

    if (newPrice === null) return;

    const price = Number(newPrice);

    if (!Number.isFinite(price) || price <= 0) {
      setMessage("सही कीमत दर्ज करें।");
      return;
    }

    const { error } = await supabase
      .from("vehicles")
      .update({ expected_price: price })
      .eq("id", vehicle.id);

    if (error) {
      setMessage("Price update error: " + error.message);
      return;
    }

    setMessage("कीमत अपडेट हो गई।");
    await loadVehicles();
  }

  async function removeVehiclePhoto(vehicle: Vehicle, photo: AdminPhoto) {
    if (removingPhotoId) return;
    if (!window.confirm(`Delete this photo for ${vehicle.brand} ${vehicle.model}? This cannot be undone.`)) return;

    setRemovingPhotoId(photo.id);
    setMessage("");

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (sessionError || !accessToken) {
        setMessage("Photo deletion error: Sign in again to continue.");
        return;
      }

      const response = await fetch(`/api/admin/vehicle-photos/${encodeURIComponent(photo.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await response.json() as { error?: unknown; details?: unknown };

      if (!response.ok) {
        const error = typeof result.error === "string" ? result.error : "The photo could not be deleted.";
        const details = typeof result.details === "string" ? ` ${result.details}` : "";
        setMessage(`Photo deletion error: ${error}${details}`);
        return;
      }

      setVehiclePhotos((current) => current.filter((item) => item.id !== photo.id));
      setPhotoPreview((current) => current?.imageUrl === photo.image_url ? null : current);
      setMessage("Vehicle photo removed.");
    } catch (error) {
      setMessage("Photo deletion error: " + (error instanceof Error ? error.message : "Network error."));
    } finally {
      setRemovingPhotoId(null);
    }
  }

  async function updateInquiryStatus(inquiry: Inquiry, status: Inquiry["status"]) {
    const { error } = await supabase
      .from("vehicle_inquiries")
      .update({ status })
      .eq("id", inquiry.id);

    if (error) {
      setMessage("Inquiry update error: " + error.message);
      return;
    }

    setMessage("Inquiry status updated.");
    await loadInquiries();
  }

  async function logout() {
    await supabase.auth.signOut();
    setAdmin(false);
    setVehicles([]);
    setVehiclePhotos([]);
    setInquiries([]);
    setPhotoPreview(null);
    setMessage("");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#12345a]" />
          Loading admin dashboard...
        </div>
      </main>
    );
  }

  if (!admin) {
    return (
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <section className="flex flex-col justify-between bg-[#0b1f3a] px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-14 lg:py-12">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-sm font-bold tracking-wide">VM</span>
              <div>
                <p className="text-sm font-semibold">Vehicle Marketplace</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">Admin console</p>
              </div>
            </div>
            <div className="my-10 max-w-lg">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">Marketplace operations</p>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Admin sign in</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Sign in to review vehicle listings and manage marketplace submissions.</p>
            </div>
            <p className="text-xs text-slate-400">Secure access for authorized administrators</p>
          </section>

          <section className="flex items-center justify-center px-5 py-10 sm:px-10">
            <form onSubmit={login} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Welcome back</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0b1f3a]">Access dashboard</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                  <input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    className="w-full rounded-md border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-700 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
                <div>
                  <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                  <input
                    id="admin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-md border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-700 focus:ring-4 focus:ring-sky-100"
                  />
                </div>
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0b1f3a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#15345b] focus:outline-none focus:ring-4 focus:ring-sky-200">
                  Sign in <Icon name="arrow" className="size-4" />
                </button>
              </div>

              {message && <p role="status" className="mt-5 break-words rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">{message}</p>}
            </form>
          </section>
        </div>
      </main>
    );
  }

  const pendingCount = vehicles.filter((vehicle) => vehicle.status === "pending").length;
  const approvedCount = vehicles.filter((vehicle) => vehicle.status === "approved").length;
  const rejectedCount = vehicles.filter((vehicle) => vehicle.status === "rejected").length;

  const statistics = [
    { label: "Total", value: vehicles.length, note: "All vehicle listings", icon: "grid" as const, tone: "slate" as const },
    { label: "Pending", value: pendingCount, note: "Awaiting review", icon: "clock" as const, tone: "amber" as const },
    { label: "Approved", value: approvedCount, note: "Approved listings", icon: "check" as const, tone: "emerald" as const },
    { label: "Rejected", value: rejectedCount, note: "Rejected listings", icon: "vehicle" as const, tone: "rose" as const },
    { label: "Inquiries", value: inquiries.length, note: "Buyer requests", icon: "arrow" as const, tone: "slate" as const },
  ];

  const photosByVehicle = new Map<string, AdminPhoto[]>();
  for (const photo of vehiclePhotos) {
    const photos = photosByVehicle.get(photo.vehicle_id) || [];
    photos.push(photo);
    photosByVehicle.set(photo.vehicle_id, photos);
  }

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-900">
      <aside className="bg-[#0b1f3a] text-white lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col">
        <div className="flex items-center justify-between px-5 py-5 lg:px-6 lg:py-7">
          <a href="#overview" className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-xs font-bold tracking-wide">VM</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">Vehicle Marketplace</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Admin console</span>
            </span>
          </a>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 lg:hidden">
            <Icon name="logout" className="size-4" /> Sign out
          </button>
        </div>

        <nav aria-label="Admin navigation" className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-col lg:px-3 lg:py-7">
          <a href="#overview" className="inline-flex shrink-0 items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white">
            <Icon name="grid" className="size-[18px] text-sky-200" /> Overview
          </a>
          <a href="#listings" className="inline-flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
            <Icon name="vehicle" className="size-[18px]" /> Vehicle listings
          </a>
          <a href="#pending-stat" className="inline-flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
            <Icon name="clock" className="size-[18px]" /> Pending review
          </a>
          <a href="#inquiries" className="inline-flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
            <Icon name="arrow" className="size-[18px]" /> Inquiries
          </a>
        </nav>

        <div className="hidden border-t border-white/10 p-4 lg:mt-auto lg:block">
          <div className="mb-3 flex items-center gap-3 px-2 py-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-[#0b1f3a]">AD</span>
            <div>
              <p className="text-xs font-semibold">Administrator</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Marketplace access</p>
            </div>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white">
            <Icon name="logout" className="size-[18px]" /> Sign out
          </button>
        </div>
      </aside>

      <main id="overview" className="min-w-0 lg:pl-64">
        <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          <header className="mb-7 sm:mb-9">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Marketplace / Overview</p>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-[#0b1f3a] sm:text-3xl">Admin dashboard</h1>
                <p className="mt-2 text-sm text-slate-600">Review submissions and manage vehicle listings.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
                <span className="size-2 rounded-full bg-emerald-500" /> Admin access active
              </div>
            </div>
          </header>

          {message && (
            <p role="status" className="mb-6 break-words rounded-md border border-slate-200 border-l-4 border-l-sky-700 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
              {message}
            </p>
          )}

          <section aria-label="Marketplace statistics" className="mb-9 grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-5">
            {statistics.map((statistic) => {
              const tones = {
                slate: "bg-slate-100 text-slate-700",
                amber: "bg-amber-50 text-amber-700",
                emerald: "bg-emerald-50 text-emerald-700",
                rose: "bg-rose-50 text-rose-700",
              };

              return (
                <article id={statistic.label === "Pending" ? "pending-stat" : undefined} key={statistic.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{statistic.label}</p>
                      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#0b1f3a]">{statistic.value}</p>
                      <p className="mt-1 text-xs text-slate-500">{statistic.note}</p>
                    </div>
                    <span className={`flex size-10 items-center justify-center rounded-md ${tones[statistic.tone]}`}>
                      <Icon name={statistic.icon} className="size-5" />
                    </span>
                  </div>
                </article>
              );
            })}
          </section>

          <section id="listings">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#0b1f3a]">Vehicle listings</h2>
                <p className="mt-1 text-sm text-slate-500">All submissions, newest first</p>
              </div>
              <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                {vehicles.length} {vehicles.length === 1 ? "listing" : "listings"}
              </span>
            </div>

            {vehicles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Icon name="vehicle" className="size-6" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-slate-800">No vehicles submitted yet</h3>
                <p className="mt-1 text-sm text-slate-500">New seller submissions will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <article key={vehicle.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                    <div className="relative bg-slate-50 p-3">
                      <div className="absolute left-5 top-5 z-10">
                        <StatusBadge status={vehicle.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-10">
                        {vehicle.image_url && (
                          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                            <button
                              type="button"
                              onClick={() => {
                                const imageUrl = vehicle.image_url;
                                if (imageUrl) {
                                  setPhotoPreview({
                                    imageUrl,
                                    alt: `${vehicle.brand} ${vehicle.model} legacy photo`,
                                    label: "Legacy photo · view only",
                                  });
                                }
                              }}
                              className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600"
                              aria-label={`Preview legacy photo of ${vehicle.brand} ${vehicle.model}`}
                            >
                              <VehiclePhoto
                                key={`${vehicle.id}-${vehicle.image_url}`}
                                imageUrl={vehicle.image_url}
                                alt={`${vehicle.brand} ${vehicle.model}`}
                                className="aspect-[4/3]"
                                sizes="(max-width: 640px) 50vw, 240px"
                              />
                            </button>
                            <p className="px-2 py-1.5 text-[11px] font-medium text-slate-500">Legacy photo · view only</p>
                          </div>
                        )}
                        {(photosByVehicle.get(vehicle.id) || []).map((photo) => (
                          <div key={photo.id} className="overflow-hidden rounded-md border border-slate-200 bg-white">
                            <button
                              type="button"
                              onClick={() => photo.image_url && setPhotoPreview({
                                imageUrl: photo.image_url,
                                alt: `${vehicle.brand} ${vehicle.model} photo`,
                                label: "New vehicle photo",
                              })}
                              disabled={!photo.image_url}
                              className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-600 disabled:cursor-not-allowed"
                              aria-label={`Preview photo of ${vehicle.brand} ${vehicle.model}`}
                            >
                              <VehiclePhoto
                                key={`${photo.id}-${photo.image_url ?? "unavailable"}`}
                                imageUrl={photo.image_url}
                                alt={`${vehicle.brand} ${vehicle.model}`}
                                className="aspect-[4/3]"
                                sizes="(max-width: 640px) 50vw, 240px"
                              />
                            </button>
                            <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                              <span className="truncate text-[11px] font-medium text-slate-500">New photo</span>
                              <button
                                type="button"
                                onClick={() => void removeVehiclePhoto(vehicle, photo)}
                                disabled={removingPhotoId !== null}
                                className="shrink-0 rounded px-2 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {removingPhotoId === photo.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        ))}
                        {!vehicle.image_url && !(photosByVehicle.get(vehicle.id) || []).length && (
                          <div className="col-span-2">
                            <VehiclePhoto
                              imageUrl={null}
                              alt={`${vehicle.brand} ${vehicle.model}`}
                              className="aspect-[4/3] rounded-md"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-[#0b1f3a]">{vehicle.brand} {vehicle.model}</h3>
                          <p className="mt-1 text-xs text-slate-500">{vehicle.vehicle_type} <span className="px-1 text-slate-300">/</span> {vehicle.manufacturing_year}</p>
                        </div>
                        <p className="shrink-0 text-base font-semibold text-[#0b1f3a]">₹{Number(vehicle.expected_price).toLocaleString("en-IN")}</p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-b border-slate-100 pb-4 text-xs text-slate-600">
                        <span>{Number(vehicle.km_driven).toLocaleString("en-IN")} km</span>
                        <span>{vehicle.fuel_type || "Fuel not specified"}</span>
                        <span>{vehicle.city}, {vehicle.state}</span>
                      </div>

                      <div className="py-4">
                        <p className="truncate text-sm font-medium text-slate-800">{vehicle.seller_name}</p>
                        <p className="mt-1 break-all text-xs text-slate-500">{vehicle.seller_phone}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                        {vehicle.status !== "approved" && (
                          <button
                            onClick={() => updateStatus(vehicle.id, "approved")}
                            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                          >
                            <Icon name="check" className="size-4" /> Approve
                          </button>
                        )}
                        {vehicle.status !== "rejected" && (
                          <button
                            onClick={() => updateStatus(vehicle.id, "rejected")}
                            className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => changePrice(vehicle)}
                          className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#0b1f3a] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
                        >
                          <Icon name="edit" className="size-4" /> Edit price
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="inquiries" className="mt-12 scroll-mt-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#0b1f3a]">Buyer inquiries</h2>
                <p className="mt-1 text-sm text-slate-500">Contact details are visible only to authorized administrators.</p>
              </div>
              <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
                {inquiries.length} {inquiries.length === 1 ? "inquiry" : "inquiries"}
              </span>
            </div>

            {inquiries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
                <h3 className="text-sm font-semibold text-slate-800">No buyer inquiries yet</h3>
                <p className="mt-1 text-sm text-slate-500">New requests will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {inquiries.map((inquiry) => {
                  const vehicle = vehicles.find((item) => item.id === inquiry.vehicle_id);

                  return (
                    <article key={inquiry.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#0b1f3a]">{inquiry.buyer_name}</p>
                          <a href={`tel:${inquiry.buyer_phone}`} className="mt-1 inline-block text-sm font-medium text-blue-700 hover:text-blue-900">
                            {inquiry.buyer_phone}
                          </a>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                          inquiry.status === "new"
                            ? "border-blue-200 bg-blue-50 text-blue-800"
                            : inquiry.status === "contacted"
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}>
                          {inquiry.status}
                        </span>
                      </div>
                      <p className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.city}` : `Vehicle #${inquiry.vehicle_id}`}
                      </p>
                      {vehicle && (
                        <p className="mt-3 text-xs text-slate-500">
                          Seller: <span className="font-semibold text-slate-700">{vehicle.seller_name}</span>
                          {" · "}
                          <a href={`tel:${vehicle.seller_phone}`} className="font-semibold text-blue-700 hover:text-blue-900">
                            Contact seller
                          </a>
                        </p>
                      )}
                      {inquiry.message && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{inquiry.message}</p>}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <time dateTime={inquiry.created_at} className="text-xs text-slate-500">
                          {new Date(inquiry.created_at).toLocaleString("en-IN")}
                        </time>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                          Update status
                          <select
                            value={inquiry.status}
                            onChange={(event) => updateInquiryStatus(inquiry, event.target.value as Inquiry["status"])}
                            className="min-h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                          </select>
                        </label>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      {photoPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={photoPreview.label}
          onClick={(event) => {
            if (event.target === event.currentTarget) setPhotoPreview(null);
          }}
        >
          <div className="w-full max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-[#0b1f3a] shadow-2xl">
            <div className="flex items-center justify-between gap-4 px-4 py-3 text-white sm:px-5">
              <p className="truncate text-sm font-semibold">{photoPreview.label}</p>
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-300"
                aria-label="Close photo preview"
              >
                <Icon name="close" className="size-5" />
              </button>
            </div>
            <div className="relative h-[70vh] max-h-[780px] min-h-64 bg-black">
              <Image
                src={photoPreview.imageUrl}
                alt={photoPreview.alt}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}