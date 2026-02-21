import prisma from "../../config/db.js";
import calculateRoute from "../../utils/calculateDistance.js";
import throwError from "../../utils/error.js";

export const getRoutesService = async () => {
    const routes = await prisma.route.findMany({
    include: {
      cityA: { select: { id: true, name: true } },
      cityB: { select: { id: true, name: true } },
    },
  }); 
  return routes
}

export const createRouteService = async ({ cityAId, cityBId }) => {

  if (cityAId === cityBId) {
    throwError("Both cities cannot be the same.", 400);
  }

  const [a, b] =
    cityAId < cityBId
      ? [cityAId, cityBId]
      : [cityBId, cityAId];

  const cities = await prisma.city.findMany({
    where: { id: { in: [a, b] } },
  });

  if (cities.length !== 2) {
    throwError("One or both cities not found.", 400);
  }

  const cityA = cities.find((c) => c.id === a);
  const cityB = cities.find((c) => c.id === b);

  if (!cityA.latitude || !cityA.longitude) {
    throwError(`Coordinates missing for ${cityA.name}`, 400);
  }

  if (!cityB.latitude || !cityB.longitude) {
    throwError(`Coordinates missing for ${cityB.name}`, 400);
  }

  const { distanceKm, durationMinutes } =
    await calculateRoute(
      cityA.latitude,
      cityA.longitude,
      cityB.latitude,
      cityB.longitude
    );

  const route = await prisma.route.create({
    data: {
      cityAId: a,
      cityBId: b,
      distanceKm,
      estimatedDuration: durationMinutes ?? null,
    },
    include: {
      cityA: { select: { id: true, name: true } },
      cityB: { select: { id: true, name: true } },
    },
  });

  return route;
};

export const searchRouteService = async ({ cityAId, cityBId }) => {

  if (cityAId === cityBId) {
    throwError("Both cities cannot be the same.", 400);
  }

  const [a, b] =
    cityAId < cityBId
      ? [cityAId, cityBId]
      : [cityBId, cityAId];

  const route = await prisma.route.findUnique({
    where: {
      cityAId_cityBId: {
        cityAId: a,
        cityBId: b,
      },
    },
    include: {
      cityA: { select: { id: true, name: true } },
      cityB: { select: { id: true, name: true } },
    },
  });

  if (!route) {
    throwError("No route found between selected cities.", 404);
  }

  return route;
};