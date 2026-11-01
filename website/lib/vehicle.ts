export type Vehicle = {
  id: string;
  vehicle_type: string;
  brand: string;
  model: string;
  manufacturing_year: number;
  km_driven: number;
  fuel_type: string | null;
  expected_price: number;
  city: string;
  state: string;
  image_url: string | null;
};

export type PublicVehicleRow = Omit<Vehicle, "image_url">;
export type PublicVehiclePhotoRow = Pick<Vehicle, "id" | "image_url">;

export const publicVehicleSelectFields =
  "id,vehicle_type,brand,model,manufacturing_year,km_driven,fuel_type,expected_price,city,state";

export function mapPublicVehicle(
  row: PublicVehicleRow,
  photo?: PublicVehiclePhotoRow
): Vehicle {
  return { ...row, image_url: photo?.image_url ?? null };
}
