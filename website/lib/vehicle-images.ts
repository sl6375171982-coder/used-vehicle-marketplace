export function getSafeVehicleImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl?.trim()) return null;

  try {
    const parsedUrl = new URL(imageUrl.trim());
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:"
      ? parsedUrl.toString()
      : null;
  } catch {
    return null;
  }
}

export function getVehiclePhotoStoragePath(imageUrl: string | null | undefined) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const safeImageUrl = getSafeVehicleImageUrl(imageUrl);

  if (!projectUrl || !safeImageUrl) return null;

  try {
    const project = new URL(projectUrl);
    const photo = new URL(safeImageUrl);
    const basePath = project.pathname.replace(/\/$/, "");
    const objectPrefix = `${basePath}/storage/v1/object/public/vehicle-photos/`;

    if (photo.origin !== project.origin || !photo.pathname.startsWith(objectPrefix)) {
      return null;
    }

    const segments = photo.pathname
      .slice(objectPrefix.length)
      .split("/")
      .map((segment) => decodeURIComponent(segment));

    if (segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("\\"))) {
      return null;
    }

    return segments.join("/");
  } catch {
    return null;
  }
}
