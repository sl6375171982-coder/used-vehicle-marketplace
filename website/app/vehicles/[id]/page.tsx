import { Suspense } from "react";
import VehicleDetails from "./VehicleDetails";

async function DynamicVehicleDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VehicleDetails vehicleId={id} />;
}

export default function VehicleDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<main className="min-h-screen animate-pulse bg-slate-100" />}>
      <DynamicVehicleDetails params={params} />
    </Suspense>
  );
}
