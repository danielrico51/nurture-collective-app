declare module "*.geojson" {
  import type { GeoJsonObject } from "geojson";
  const value: GeoJsonObject;
  export default value;
}

declare module "@/data/*.geojson" {
  import type { GeoJsonObject } from "geojson";
  const value: GeoJsonObject;
  export default value;
}
