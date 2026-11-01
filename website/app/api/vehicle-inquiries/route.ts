import { createClient } from "@supabase/supabase-js";

const noStoreHeaders = { "Cache-Control": "no-store" };
const vehicleIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const mobilePattern = /^[6-9]\d{9}$/;

function jsonError(status: number, error: string) {
  return Response.json({ error }, { status, headers: noStoreHeaders });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return jsonError(415, "Submit the inquiry as JSON.");
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > 8192) {
    return jsonError(413, "The inquiry is too large.");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError(400, "The inquiry could not be read.");
  }

  if (!isRecord(payload) || Object.keys(payload).some((key) =>
    !["vehicle_id", "buyer_name", "buyer_phone", "message"].includes(key)
  )) {
    return jsonError(400, "The inquiry details are invalid.");
  }

  const vehicleId = payload.vehicle_id;
  const buyerName = typeof payload.buyer_name === "string" ? payload.buyer_name.trim() : "";
  const buyerPhone = typeof payload.buyer_phone === "string" ? payload.buyer_phone : "";
  const buyerMessage = typeof payload.message === "string" ? payload.message.trim() : "";

  if (
    typeof vehicleId !== "string" ||
    !vehicleIdPattern.test(vehicleId) ||
    buyerName.length < 2 ||
    buyerName.length > 100 ||
    !mobilePattern.test(buyerPhone) ||
    buyerMessage.length > 1000 ||
    (payload.message !== null && typeof payload.message !== "string")
  ) {
    return jsonError(400, "The inquiry details are invalid.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.error("Buyer inquiry submission is not configured.");
    return jsonError(500, "We could not send your inquiry. Please try again.");
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { error } = await supabase.from("vehicle_inquiries").insert({
    vehicle_id: vehicleId,
    buyer_name: buyerName,
    buyer_phone: buyerPhone,
    message: buyerMessage || null,
  });

  if (error?.code === "23505") {
    return Response.json({ accepted: true }, { status: 202, headers: noStoreHeaders });
  }

  if (error) {
    console.error("Buyer inquiry insertion failed:", error.message);
    return jsonError(500, "We could not send your inquiry. Please try again.");
  }

  return Response.json({ accepted: true }, { status: 202, headers: noStoreHeaders });
}
