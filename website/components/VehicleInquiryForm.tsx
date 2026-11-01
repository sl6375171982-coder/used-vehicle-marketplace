"use client";

import { useRef, useState } from "react";
import type { Vehicle } from "@/lib/vehicle";
import VehiclePhoto from "@/components/VehiclePhoto";

const mobilePattern = /^[6-9]\d{9}$/;

function formatPrice(price: number) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

export default function VehicleInquiryForm({
  vehicle,
  onClose,
}: {
  vehicle: Vehicle;
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submissionLock = useRef(false);

  async function submitInquiry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionLock.current) return;

    const formData = new FormData(event.currentTarget);
    const buyerName = String(formData.get("buyer_name") || "").trim();
    const buyerPhone = String(formData.get("buyer_phone") || "").replace(/\D/g, "");
    const buyerMessage = String(formData.get("message") || "").trim();

    if (buyerName.length < 2 || buyerName.length > 100) {
      setMessage("Enter a name between 2 and 100 characters.");
      return;
    }

    if (!mobilePattern.test(buyerPhone)) {
      setMessage("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (buyerMessage.length > 1000) {
      setMessage("Your message must be 1,000 characters or fewer.");
      return;
    }

    submissionLock.current = true;
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/vehicle-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          message: buyerMessage || null,
        }),
      });

      if (!response.ok) {
        setMessage("We could not send your inquiry. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setMessage("We could not send your inquiry. Please try again.");
    } finally {
      setSubmitting(false);
      submissionLock.current = false;
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-title"
        className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-5 border-b border-slate-100 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Buyer inquiry</p>
            <h2 id="inquiry-title" className="mt-1 text-2xl font-black text-slate-950">
              {submitted ? "Request received" : "Buy For Query"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close inquiry form"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
          >
            <span aria-hidden="true" className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[0.95fr_1.05fr]">
          <div>
            <VehiclePhoto
              imageUrl={vehicle.image_url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="rounded-2xl"
              sizes="(max-width: 768px) 100vw, 320px"
            />
            <div className="mt-4">
              <span className="text-xs font-bold uppercase tracking-wide text-blue-700">{vehicle.vehicle_type}</span>
              <h3 className="mt-1 text-xl font-black text-slate-950">{vehicle.brand} {vehicle.model}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {vehicle.manufacturing_year} · {Number(vehicle.km_driven).toLocaleString("en-IN")} km
                <br />
                {vehicle.fuel_type || "Fuel not specified"} · {vehicle.city}, {vehicle.state}
              </p>
              <p className="mt-3 text-2xl font-black text-blue-950">{formatPrice(vehicle.expected_price)}</p>
            </div>
          </div>

          {submitted ? (
            <div className="flex flex-col justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
                  <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Your details have been sent securely to the marketplace team. Your phone number is not shown publicly.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 min-h-12 rounded-xl bg-[#0b1f3a] px-5 font-bold text-white transition hover:bg-blue-900"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={submitInquiry} className="space-y-4">
              <p className="text-sm leading-6 text-slate-600">
                Leave your details and the seller can follow up. Contact numbers stay private.
              </p>
              <div>
                <label htmlFor="buyer-name" className="mb-1.5 block text-sm font-semibold text-slate-700">Your name</label>
                <input
                  id="buyer-name"
                  name="buyer_name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="buyer-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">Mobile number</label>
                <input
                  id="buyer-phone"
                  name="buyer_phone"
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  autoComplete="tel-national"
                  placeholder="10-digit mobile number"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="buyer-message" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Message <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="buyer-message"
                  name="message"
                  rows={3}
                  maxLength={1000}
                  placeholder="Ask a question about this vehicle..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              {message && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="min-h-12 w-full rounded-xl bg-[#0b1f3a] px-5 font-bold text-white shadow-lg shadow-blue-950/10 transition hover:bg-blue-900 disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? "Sending inquiry..." : "Send inquiry"}
              </button>
              <p className="text-center text-xs leading-5 text-slate-400">
                We only use your information to respond to this inquiry.
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
