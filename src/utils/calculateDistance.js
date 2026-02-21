import axios from "axios";

const calculateRoute = async (lat1, lng1, lat2, lng2) => {
  const url = `http://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;

  const response = await axios.get(url);

  if (!response.data.routes.length) {
    throwError("Unable to calculate route.", 400);
  }

  const route = response.data.routes[0];

  return {
    distanceKm: Math.round(route.distance / 1000),
    durationMinutes: Math.round(route.duration / 60),
  };
};

export default calculateRoute;
