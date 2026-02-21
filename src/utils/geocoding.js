import axios from "axios";
import throwError from "./error.js";

const geocodeCity = async (cityName) => {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    cityName,
  )}&format=json&limit=1`;

  const response = await axios.get(url, {
    headers: {
      "User-Agent": "smartbus-app",
    },
  });

  if (!response.data.length) {
    throwError("Unable to geocode city.", 400);
  }

  return {
    lat: parseFloat(response.data[0].lat),
    lng: parseFloat(response.data[0].lon),
  };
};

export default geocodeCity;
