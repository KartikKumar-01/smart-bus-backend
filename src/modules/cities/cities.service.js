import prisma from "../../config/db.js";
import { toCamelCase } from "../../utils/format.js";
import geocodeCity from "../../utils/geocoding.js";
import uploadImage from "../../utils/uploadImage.js";
import throwError from "../../utils/error.js";
import cloudinary from "../../config/cloudinary.js";

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
    orderBy: [{ popularity: "desc" }, { name: "asc" }],
  });

  const message =
    cities.length == 0 ? "No cities found." : "Cities fetched successfully.";

  return { cities, message };
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

export const addStateService = async (name) => {
  const formattedName = toCamelCase(name);

  const existing = await prisma.state.findFirst({
    where: {
      name: { equals: formattedName, mode: "insensitive" },
    },
  });

  if (existing) throwError("State name already exists.", 409);

  return prisma.state.create({
    data: { name: formattedName },
  });
};

export const getAllStatesService = async () => {
  return prisma.state.findMany({
    select: {
      id: true,
      name: true,
      cities: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const addCityService = async ({ cityName, stateId, image }) => {
  const state = await prisma.state.findUnique({
    where: { id: Number(stateId) },
  });

  if (!state) throwError("State not found.", 404);

  const formattedName = toCamelCase(cityName);

  const existing = await prisma.city.findFirst({
    where: {
      name: { equals: formattedName, mode: "insensitive" },
      stateId: Number(stateId),
    },
  });

  if (existing) throwError("City already exists in this state.", 409);

  let coordinates = null;
  try {
    coordinates = await geocodeCity(cityName);
  } catch (err) {
    console.error("Geocoding failed:", err.message);
  }

  let uploadedImage = null;

  try {
    if (image) {
      uploadedImage = await uploadImage(image);
    }

    const city = await prisma.city.create({
      data: {
        name: formattedName,
        stateId: state.id,
        state: state.name,
        imageUrl: uploadedImage?.image_url ?? null,
        imagePublicId: uploadedImage?.public_id ?? null,
        latitude: coordinates?.lat ?? null,
        longitude: coordinates?.lng ?? null,
      },
    });

    return city;
  } catch (err) {
    if (uploadedImage?.public_id) {
      await cloudinary.uploader.destroy(uploadedImage.public_id);
    }
    throw err;
  }
};

export const removeCityService = async (cityId) => {
  const id = Number(cityId);

  const city = await prisma.city.findUnique({
    where: { id },
  });

  if (!city) throwError("City not found.", 404);

  const routeFrom = await prisma.route.findFirst({
    where: { cityAId: id },
  });
  const routeTo = await prisma.route.findFirst({
    where: { cityBId: id },
  });

  if (routeFrom || routeTo)
    throwError("Cannot delete city. Routes exist from or to this city.", 400);

  await prisma.city.delete({ where: { id } });

  if (city.imagePublicId) {
    await cloudinary.uploader.destroy(city.imagePublicId);
  }

  return city;
};

export const uploadCityImageService = async (cityId, image) => {
  const id = Number(cityId);

  const city = await prisma.city.findUnique({
    where: { id },
  });

  if (!city) throwError("City not found.", 404);

  const uploaded = await uploadImage(image);

  await prisma.city.update({
    where: { id },
    data: {
      imageUrl: uploaded.image_url,
      imagePublicId: uploaded.public_id,
    },
  });

  if (city.imagePublicId) {
    await cloudinary.uploader.destroy(city.imagePublicId);
  }

  return prisma.city.findUnique({ where: { id } });
};
