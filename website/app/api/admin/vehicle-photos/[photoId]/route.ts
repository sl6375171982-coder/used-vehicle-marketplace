import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const STORAGE_BUCKET = "vehicle-photos-private";

function jsonError(status: number, error: string, details?: string) {
  return Response.json({ error, ...(details ? { details } : {}) }, { status });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const photoId = (await params).photoId;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(photoId)) {
    return jsonError(400, "Invalid photo ID.");
  }

  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!accessToken) return jsonError(401, "Sign in as an administrator to remove photos.");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.error("Photo deletion auth is not configured.");
    return jsonError(500, "Photo deletion is not configured on the server.");
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const { data: userData, error: authError } = await authClient.auth.getUser(accessToken);
  if (authError || !userData.user) {
    return jsonError(401, "Your session is invalid or expired. Sign in again.");
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("Photo deletion server configuration error:", error);
    return jsonError(500, "Photo deletion is not configured on the server.");
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (adminError) {
    console.error("Photo deletion admin verification failed:", adminError.message);
    return jsonError(500, "Administrator access could not be verified.");
  }
  if (!admin) return jsonError(403, "Administrator access is required.");

  const { data: photo, error: photoError } = await supabase
    .from("vehicle_photos")
    .select("id,vehicle_id,storage_path")
    .eq("id", photoId)
    .maybeSingle();

  if (photoError) {
    console.error("Photo mapping lookup failed:", photoError.message);
    return jsonError(500, "Could not load the photo mapping.");
  }
  if (!photo) return jsonError(404, "Photo was not found or was already removed.");
  const [vehicleFolder, fileName, ...extraPathSegments] = photo.storage_path.split("/");
  if (
    vehicleFolder !== photo.vehicle_id ||
    extraPathSegments.length > 0 ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i.test(fileName || "")
  ) {
    console.error("Photo mapping path is outside its vehicle folder:", photo.id);
    return jsonError(409, "The photo mapping has an invalid storage path; no data was deleted.");
  }

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([photo.storage_path]);

  if (storageError) {
    console.error("Private vehicle photo removal failed:", {
      photoId,
      message: storageError.message,
    });
    return jsonError(502, "The photo file could not be deleted; its database record was kept.", storageError.message);
  }

  const { data: deletedMapping, error: mappingError } = await supabase
    .from("vehicle_photos")
    .delete()
    .eq("id", photo.id)
    .eq("vehicle_id", photo.vehicle_id)
    .eq("storage_path", photo.storage_path)
    .select("id")
    .maybeSingle();

  if (mappingError || !deletedMapping) {
    console.error("Photo mapping removal failed after Storage object removal:", {
      photoId,
      message: mappingError?.message ?? "No mapping row was deleted.",
    });
    return jsonError(
      500,
      "The photo file was deleted, but its mapping record could not be removed.",
      mappingError?.message
    );
  }

  return Response.json({ deleted: true, photoId });
}
