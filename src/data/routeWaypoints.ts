/**
 * Waypoints of each delivery route, depot first. They are the input for
 * scripts/snap-routes-osrm.mjs, which turns them into road geometry (routeGeometry.ts).
 * Kept free of imports so the script can load this file directly with Node.
 */
export const ROUTE_WAYPOINTS: Record<string, [number, number][]> = {
  "R-12": [
    [-60.0236, -3.1303],
    [-60.018, -3.1],
    [-60.012, -3.07],
    [-60.008, -3.045],
    [-60.0, -3.028],
    [-60.022, -3.04],
    [-60.03, -3.075],
  ],
  "R-07": [
    [-60.016, -3.118],
    [-60.008, -3.112],
    [-60.012, -3.102],
    [-60.023, -3.108],
    [-60.028, -3.122],
    [-60.02, -3.128],
  ],
  "R-19": [
    [-60.0236, -3.1303],
    [-60.01, -3.135],
    [-59.99, -3.128],
    [-59.97, -3.122],
    [-59.955, -3.118],
  ],
};
