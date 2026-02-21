import prisma from "../../config/db.js";
import { toCamelCase } from "../../utils/format.js";
import geocodeCity from "../../utils/geocoding.js";
import uploadImage from "../../utils/uploadImage.js";

export const addCityService = async (cityName, state = null, image) => {
  const alreadyExist = await prisma.city.findFirst({
    where: {
      name: {
        equals: toCamelCase(cityName),
        mode: "insensitive",
      },
    },
  });

  if (alreadyExist) {
    throw new Error("City already exists.");
  }

  const coordinates = await geocodeCity(cityName);

  const uploaded = image ? await uploadImage(image) : null;


  const city = await prisma.city.create({
    data: {
      name: toCamelCase(cityName),
      state: toCamelCase(state),
      imageUrl: uploaded?.image_url ?? null,
      imagePublicId: uploaded?.public_id ?? null,
      latitude: coordinates?.lat ?? null,
      longitude: coordinates?.lng ?? null,
    },
  });

  return city;
};

export const getCitiesService = async (query = null) => {
  let cities;
  const whereQuery = query?.trim()
    ? {
        name: {
          startsWith: query.trim(),
          mode: "insensitive",
        },
      }
    : {};
  cities = await prisma.city.findMany({
    where: whereQuery,
    select: {
      id: true,
      name: true,
      state: true,
      imageUrl: true,
      imagePublicId: true,
    },
    take: 8,
    orderBy: [{ popularity: "desc" }, { name: "asc" }],
  });

  const message =
    cities.length == 0 ? "No cities found." : "Cities fetched successfully.";

  return { cities, message };
};

export const removeCityService = async (cityId) => {
  const city = await prisma.city.findUnique({
    where: { id: cityId },
  });

  if (!city) {
    const error = new Error("City does not exist.");
    error.statusCode = 404;
    throw error;
  }

  const relatedRoute = await prisma.route.findFirst({
    where: {
      OR: [{ cityA: cityId }, { cityB: cityId }],
    },
  });

  if (relatedRoute) {
    const error = new Error("Cannot delete city. It is used in routes.");
    error.statusCode = 409;
    throw error;
  }

  await prisma.city.delete({
    where: { id: cityId },
  });

  return city;
};

export const increaseCityPopularity = async (cityId, value = 1) => {
  await prisma.city.update({
    where: { id: cityId },
    data: {
      popularity: {
        increment: value,
      },
    },
  });
};

export const addCityImageService = async (cityId, image) => {
  const city = await prisma.city.findUnique({
    where: { id: Number(cityId) },
  });

  if (!city) {
    const error = new Error("City not found.");
    error.statusCode = 404;
    throw error;
  }

  if (city.imagePublicId) {
    await cloudinary.uploader.destroy(city.imagePublicId);
  }

  const uploaded = await uploadImage(image);

  const updatedCity = await prisma.city.update({
    where: { id: Number(cityId) },
    data: {
      imageUrl: uploaded.image_url,
      imagePublicId: uploaded.public_id,
    },
  });

  return updatedCity;
};