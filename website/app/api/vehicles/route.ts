import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const STORAGE_BUCKET = "vehicle-photos-private";
const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_PHOTO_BYTES = 20 * 1024 * 1024;
const MAX_REQUEST_BYTES = 21 * 1024 * 1024;

const vehicleTypes = new Set([
  "Car",
  "Bike",
  "Scooter",
  "Truck",
  "Bus",
  "Pickup",
  "Commercial",
  "Other",
]);
const fuelTypes = new Set(["Petrol", "Diesel", "CNG", "Electric", "Hybrid", "Other"]);

type VehicleSubmission = {
  vehicle_type: string;
  brand: string;
  model: string;
  manufacturing_year: number;
  km_driven: number;
  fuel_type: string;
  expected_price: number;
  city: string;
  state: string;
  seller_name: string;
  seller_phone: string;
};

type ValidatedPhoto = {
  bytes: Buffer;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

type CleanupFailure = {
  step: string;
  message: string;
};

class SubmissionFailure extends Error {
  constructor(
    message: string,
    readonly step: string
  ) {
    super(message);
    this.name = "SubmissionFailure";
  }
}

function jsonError(status: number, error: string, details?: unknown) {
  return Response.json({ error, ...(details ? { details } : {}) }, { status });
}

function readText(formData: FormData, name: string, maxLength: number): string {
  const values = formData.getAll(name);
  if (values.length !== 1 || typeof values[0] !== "string") {
    throw new Error(`Provide exactly one ${name.replaceAll("_", " ")} value.`);
  }

  const value = values[0].trim();
  if (!value || value.length > maxLength) {
    throw new Error(`${name.replaceAll("_", " ")} is required and must be at most ${maxLength} characters.`);
  }
  return value;
}

function readInteger(formData: FormData, name: string, minimum: number, maximum: number): number {
  const value = readText(formData, name, 32);
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name.replaceAll("_", " ")} must be a whole number.`);
  }

  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) {
    throw new Error(`${name.replaceAll("_", " ")} must be between ${minimum} and ${maximum}.`);
  }
  return number;
}

function parseVehicleSubmission(formData: FormData): VehicleSubmission {
  const permittedFields = new Set([
    "vehicle_type",
    "brand",
    "model",
    "manufacturing_year",
    "km_driven",
    "fuel_type",
    "expected_price",
    "city",
    "state",
    "seller_name",
    "seller_phone",
    "photos",
  ]);
  for (const [name] of formData.entries()) {
    if (!permittedFields.has(name)) {
      throw new Error(`Unexpected form field: ${name}.`);
    }
  }

  const vehicleType = readText(formData, "vehicle_type", 40);
  if (!vehicleTypes.has(vehicleType)) {
    throw new Error("Select a valid vehicle type.");
  }

  const fuelType = readText(formData, "fuel_type", 40);
  if (!fuelTypes.has(fuelType)) {
    throw new Error("Select a valid fuel type.");
  }

  const phone = readText(formData, "seller_phone", 10);
  if (!/^\d{10}$/.test(phone)) {
    throw new Error("Seller phone must contain exactly 10 digits.");
  }

  const priceValue = readText(formData, "expected_price", 32);
  if (!/^\d+(?:\.\d{1,2})?$/.test(priceValue)) {
    throw new Error("Expected price must be a positive amount with at most two decimal places.");
  }
  const expectedPrice = Number(priceValue);
  if (!Number.isFinite(expectedPrice) || expectedPrice <= 0 || expectedPrice > 99999999999) {
    throw new Error("Expected price is outside the permitted range.");
  }

  return {
    vehicle_type: vehicleType,
    brand: readText(formData, "brand", 100),
    model: readText(formData, "model", 100),
    manufacturing_year: readInteger(formData, "manufacturing_year", 1900, new Date().getFullYear()),
    km_driven: readInteger(formData, "km_driven", 0, 10000000),
    fuel_type: fuelType,
    expected_price: expectedPrice,
    city: readText(formData, "city", 100),
    state: readText(formData, "state", 100),
    seller_name: readText(formData, "seller_name", 100),
    seller_phone: phone,
  };
}

function photoFormat(bytes: Buffer): ValidatedPhoto["contentType"] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

async function validatePhotos(formData: FormData): Promise<ValidatedPhoto[]> {
  const entries = formData.getAll("photos");
  if (entries.length > MAX_PHOTOS) {
    throw new Error(`Upload no more than ${MAX_PHOTOS} photos at once.`);
  }

  const photos: ValidatedPhoto[] = [];
  let totalBytes = 0;
  for (const [index, entry] of entries.entries()) {
    if (typeof entry === "string") {
      throw new Error(`Photo ${index + 1} is not a file.`);
    }
    if (entry.size <= 0 || entry.size > MAX_PHOTO_BYTES) {
      throw new Error(`Photo ${index + 1} must be between 1 byte and 5 MB.`);
    }

    totalBytes += entry.size;
    if (totalBytes > MAX_TOTAL_PHOTO_BYTES) {
      throw new Error("The combined photo size must not exceed 20 MB.");
    }

    const bytes = Buffer.from(await entry.arrayBuffer());
    const detectedType = photoFormat(bytes);
    if (
      !detectedType ||
      entry.type !== detectedType ||
      !["image/jpeg", "image/png", "image/webp"].includes(entry.type)
    ) {
      throw new Error(`Photo ${index + 1} must be a valid JPEG, PNG, or WebP image.`);
    }

    photos.push({
      bytes,
      contentType: detectedType,
      extension: detectedType === "image/jpeg" ? "jpg" : detectedType.slice("image/".length) as "png" | "webp",
    });
  }
  return photos;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected server error.";
}

async function cleanUpSubmission(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  vehicleId: string,
  attemptedPaths: string[],
  mappingsMayExist: boolean,
  vehicleWasCreated: boolean,
  vehicleCreationOutcomeUnknown: boolean
): Promise<CleanupFailure[]> {
  const failures: CleanupFailure[] = [];
  if (!vehicleWasCreated && !vehicleCreationOutcomeUnknown) return failures;

  if (vehicleCreationOutcomeUnknown) {
    try {
      const { data: possibleVehicle, error } = await supabase
        .from("vehicles")
        .select("id")
        .eq("id", vehicleId)
        .maybeSingle();

      if (error) {
        return [{
          step: "check vehicle creation outcome",
          message: error.message,
        }];
      }
      if (!possibleVehicle) return failures;
      vehicleWasCreated = true;
    } catch (error) {
      return [{
        step: "check vehicle creation outcome",
        message: errorMessage(error),
      }];
    }
  }

  const removedPaths: string[] = [];

  for (const path of attemptedPaths) {
    try {
      const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      if (error) {
        failures.push({ step: `remove photo ${path}`, message: error.message });
      } else {
        removedPaths.push(path);
      }
    } catch (error) {
      failures.push({ step: `remove photo ${path}`, message: errorMessage(error) });
    }
  }

  let mappingsCleaned = true;
  if (mappingsMayExist && removedPaths.length > 0) {
    try {
      const { data: existingMappings, error: readError } = await supabase
        .from("vehicle_photos")
        .select("storage_path")
        .eq("vehicle_id", vehicleId)
        .in("storage_path", removedPaths);

      if (readError) {
        mappingsCleaned = false;
        failures.push({ step: "find new photo mappings", message: readError.message });
      } else if (existingMappings.length > 0) {
        const mappingPaths = existingMappings.map((mapping) => mapping.storage_path);
        const { data: deletedMappings, error: deleteError } = await supabase
          .from("vehicle_photos")
          .delete()
          .eq("vehicle_id", vehicleId)
          .in("storage_path", mappingPaths)
          .select("storage_path");

        if (deleteError) {
          mappingsCleaned = false;
          failures.push({ step: "remove new photo mappings", message: deleteError.message });
        } else if (deletedMappings.length !== mappingPaths.length) {
          mappingsCleaned = false;
          failures.push({
            step: "remove new photo mappings",
            message: "Not all mappings for successfully removed photos were deleted.",
          });
        }
      }
    } catch (error) {
      mappingsCleaned = false;
      failures.push({ step: "remove new photo mappings", message: errorMessage(error) });
    }
  }

  const allPhotosRemoved = removedPaths.length === attemptedPaths.length;
  if (mappingsCleaned && (allPhotosRemoved || !mappingsMayExist)) {
    try {
      const { data: deletedVehicles, error } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicleId)
        .select("id");

      if (error) {
        failures.push({ step: "remove newly created vehicle", message: error.message });
      } else if (deletedVehicles.length !== 1) {
        failures.push({
          step: "remove newly created vehicle",
          message: "The newly created vehicle was not confirmed as deleted.",
        });
      }
    } catch (error) {
      failures.push({ step: "remove newly created vehicle", message: errorMessage(error) });
    }
  } else {
    failures.push({
      step: "remove newly created vehicle",
      message: "Retained the new vehicle because a photo or mapping cleanup failed.",
    });
  }

  return failures;
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data")) {
    return jsonError(415, "Submit vehicle details and photos as multipart form data.");
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_REQUEST_BYTES) {
    return jsonError(413, "The total upload request must not exceed 21 MB.");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "The multipart form data could not be read.");
  }

  let vehicle: VehicleSubmission;
  let photos: ValidatedPhoto[];
  try {
    vehicle = parseVehicleSubmission(formData);
    photos = await validatePhotos(formData);
  } catch (error) {
    return jsonError(400, errorMessage(error));
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch (error) {
    console.error("Vehicle upload server configuration error:", errorMessage(error));
    return jsonError(500, "Vehicle submission is not configured on the server.");
  }

  const vehicleId = randomUUID();
  const attemptedPaths: string[] = [];
  let mappingsMayExist = false;
  let vehicleWasCreated = false;
  let vehicleCreationOutcomeUnknown = false;

  try {
    vehicleCreationOutcomeUnknown = true;
    const vehicleResult = await supabase
      .from("vehicles")
      .insert({
        id: vehicleId,
        ...vehicle,
        image_url: null,
        status: "pending",
      })
      .select("id")
      .single();
    vehicleCreationOutcomeUnknown = false;

    if (vehicleResult.error) {
      throw new SubmissionFailure(vehicleResult.error.message, "create vehicle");
    }
    vehicleWasCreated = true;
    if (vehicleResult.data.id !== vehicleId) {
      throw new SubmissionFailure("The created vehicle ID did not match the submission.", "create vehicle");
    }

    const photoMappings: {
      vehicle_id: string;
      storage_path: string;
      sort_order: number;
    }[] = [];

    for (const [sortOrder, photo] of photos.entries()) {
      const path = `${vehicleId}/${randomUUID()}.${photo.extension}`;
      attemptedPaths.push(path);

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, photo.bytes, {
          contentType: photo.contentType,
          upsert: false,
        });

      if (uploadError) {
        throw new SubmissionFailure(uploadError.message, `upload photo ${sortOrder + 1}`);
      }

      photoMappings.push({
        vehicle_id: vehicleId,
        storage_path: path,
        sort_order: sortOrder,
      });
    }

    if (photoMappings.length > 0) {
      mappingsMayExist = true;
      const { data: insertedMappings, error: mappingError } = await supabase
        .from("vehicle_photos")
        .insert(photoMappings)
        .select("storage_path");

      if (mappingError) {
        throw new SubmissionFailure(mappingError.message, "save photo mappings");
      }
      if (insertedMappings.length !== photoMappings.length) {
        throw new SubmissionFailure("Not all photo mappings were confirmed.", "save photo mappings");
      }
    }

    return Response.json({ vehicleId, photoCount: photoMappings.length }, { status: 201 });
  } catch (error) {
    const failure = error instanceof SubmissionFailure
      ? error
      : new SubmissionFailure(errorMessage(error), "process vehicle submission");
    const cleanupFailures = await cleanUpSubmission(
      supabase,
      vehicleId,
      attemptedPaths,
      mappingsMayExist,
      vehicleWasCreated,
      vehicleCreationOutcomeUnknown
    );

    console.error("Vehicle submission failed:", {
      vehicleId,
      step: failure.step,
      message: failure.message,
      cleanupFailures,
    });

    return jsonError(500, `Vehicle submission failed during ${failure.step}.`, {
      message: failure.message,
      cleanupFailures,
    });
  }
}
