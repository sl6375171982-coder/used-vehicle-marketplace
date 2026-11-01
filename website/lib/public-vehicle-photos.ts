import type { SupabaseClient } from "@supabase/supabase-js";

export type PublicVehiclePhoto = {
  id: string;
  image_url: string;
};

type PhotoLoadResult = {
  photosByVehicleId: Map<string, PublicVehiclePhoto[]>;
  error: string | null;
};

export async function loadApprovedVehiclePhotos(
  supabase: SupabaseClient,
  vehicleIds: string[]
): Promise<PhotoLoadResult> {
  const photosByVehicleId = new Map<string, PublicVehiclePhoto[]>();
  if (vehicleIds.length === 0) return { photosByVehicleId, error: null };

  const { data: mappings, error: mappingsError } = await supabase
    .from("vehicle_photos")
    .select("id,vehicle_id,storage_path,sort_order")
    .in("vehicle_id", vehicleIds)
    .order("sort_order", { ascending: true });

  let photoError: string | null = mappingsError
    ? `${mappingsError.code}: ${mappingsError.message}`
    : null;

  if (!mappingsError && mappings?.length) {
    const signedPhotos = await Promise.all(mappings.map(async (photo) => {
      const { data, error } = await supabase.storage
        .from("vehicle-photos-private")
        .createSignedUrl(photo.storage_path, 3600);

      return error
        ? { photo: null, error: `${error.message}` }
        : {
            photo: {
              vehicleId: photo.vehicle_id,
              id: photo.id,
              image_url: data.signedUrl,
            },
            error: null,
          };
    }));

    for (const result of signedPhotos) {
      if (result.error) {
        photoError = photoError
          ? `${photoError}; ${result.error}`
          : result.error;
        continue;
      }
      if (!result.photo) continue;

      const vehiclePhotos = photosByVehicleId.get(result.photo.vehicleId) || [];
      vehiclePhotos.push({ id: result.photo.id, image_url: result.photo.image_url });
      photosByVehicleId.set(result.photo.vehicleId, vehiclePhotos);
    }
  }

  const legacyVehicleIds = vehicleIds.filter((vehicleId) => !photosByVehicleId.has(vehicleId));
  if (legacyVehicleIds.length > 0) {
    const { data: legacyPhotos, error: legacyError } = await supabase
      .from("public_vehicle_photos")
      .select("id,image_url")
      .in("id", legacyVehicleIds);

    if (legacyError) {
      photoError = photoError
        ? `${photoError}; ${legacyError.code}: ${legacyError.message}`
        : `${legacyError.code}: ${legacyError.message}`;
    } else {
      for (const photo of legacyPhotos || []) {
        if (!photo.image_url) continue;
        photosByVehicleId.set(photo.id, [{ id: `legacy-${photo.id}`, image_url: photo.image_url }]);
      }
    }
  }

  return { photosByVehicleId, error: photoError };
}
