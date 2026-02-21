import prisma from "../../config/db.js";
import { toCamelCase } from "../../utils/format.js";

export const addCityService = async (cityName, state = null) => {
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

  const city = await prisma.city.create({
    data: {
      name: toCamelCase(cityName),
      state: toCamelCase(state),
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
      OR: [{ sourceCityId: cityId }, { destinationCityId: cityId }],
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
        where: {id: cityId},
        data: {
            popularity: {
                increment: value,
            }
        }
    })
}