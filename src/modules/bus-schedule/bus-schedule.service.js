import prisma from "../../config/db.js";
import throwError from "../../utils/error.js";

export const addBusScheduleService = async ({
  userId,
  busId,
  fromCityId,
  toCityId,
  departureTime,
  arrivalTime,
  basePrice,
}) => {

  const operator = await prisma.operator.findUnique({
    where: { userId: Number(userId) },
  });
  if (!operator) throwError("Operator profile not found.", 404);

  const bus = await prisma.bus.findUnique({
    where: { id: Number(busId) },
  });
  if (!bus) throwError("Bus not found.", 404);
  if (bus.operatorId !== operator.id)
    throwError("This bus does not belong to you.", 403);

  const fromId = Number(fromCityId);
  const toId = Number(toCityId);

  const route = await prisma.route.findFirst({
    where: {
      OR: [
        { cityAId: fromId, cityBId: toId },
        { cityAId: toId, cityBId: fromId },
      ],
    },
    include: {
      cityA: { select: { name: true } },
      cityB: { select: { name: true } },
    },
  });

  if (!route)
    throwError("No route between the cities. Create one first.", 404);

  const direction =
    route.cityAId === fromId && route.cityBId === toId
      ? "FORWARD"
      : "REVERSE";

  const depTime = new Date(departureTime);
  const arrTime = new Date(arrivalTime);

  if (isNaN(depTime) || isNaN(arrTime))
    throwError("Invalid date format.", 400);

  if (depTime >= arrTime)
    throwError("Arrival must be after departure.", 400);

  const overlappingSchedule = await prisma.busSchedule.findFirst({
    where: {
      busId: bus.id,
      status: "ACTIVE",
      AND: [
        { departureTime: { lt: arrTime } },
        { arrivalTime: { gt: depTime } },
      ],
    },
  });

  if (overlappingSchedule)
    throwError(
      "This bus is already assigned to another active schedule during this time.",
      400
    );

  const schedule = await prisma.busSchedule.create({
    data: {
      busId: bus.id,
      routeId: route.id,
      direction,
      departureTime: depTime,
      arrivalTime: arrTime,
      basePrice: Number(basePrice),
      status: "ACTIVE",
    },
  });

  const isForward = direction === "FORWARD";

  return {
    id: schedule.id,
    busId: bus.id,
    busNumber: bus.busNumber,
    busType: bus.busType,
    status: schedule.status,
    departureTime: schedule.departureTime,
    arrivalTime: schedule.arrivalTime,
    basePrice: schedule.basePrice,
    from: isForward ? route.cityA.name : route.cityB.name,
    to: isForward ? route.cityB.name : route.cityA.name,
  };
};

export const getAllBusesSchedulesService = async ({
  userId,
  limit = 10,
  cursor,
}) => {

  const operator = await prisma.operator.findUnique({
    where: { userId: Number(userId) },
  });
  if (!operator) throwError("Operator profile not found.", 404);

  const pageSize = Number(limit);

  const schedules = await prisma.busSchedule.findMany({
    take: pageSize + 1,
    ...(cursor && {
      cursor: { id: Number(cursor) },
      skip: 1,
    }),
    where: {
      bus: { operatorId: operator.id },
    },
    orderBy: { id: "asc" },
    include: {
      bus: {
        select: {
          id: true,
          busNumber: true,
          busType: true,
        },
      },
      route: {
        select: {
          cityA: { select: { name: true } },
          cityB: { select: { name: true } },
        },
      },
    },
  });

  let nextCursor = null;
  if (schedules.length > pageSize) {
    nextCursor = schedules.pop().id;
  }

  const formattedSchedules = schedules.map((schedule) => {
    const isForward = schedule.direction === "FORWARD";

    return {
      id: schedule.id,
      busId: schedule.bus.id,
      busNumber: schedule.bus.busNumber,
      busType: schedule.bus.busType,
      status: schedule.status,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      basePrice: schedule.basePrice,
      from: isForward
        ? schedule.route.cityA.name
        : schedule.route.cityB.name,
      to: isForward
        ? schedule.route.cityB.name
        : schedule.route.cityA.name,
    };
  });

  return { schedules: formattedSchedules, nextCursor };
};

export const searchBusSchedulesService = async ({
  fromCityId,
  toCityId,
  date,
  limit = 10,
  cursor,
}) => {

  const fromId = Number(fromCityId);
  const toId = Number(toCityId);

  if (fromId === toId)
    throwError("Both cities cannot be same.", 400);

  const parsedDate = new Date(date);
  if (isNaN(parsedDate))
    throwError("Invalid date format. Use YYYY-MM-DD.", 400);

  const route = await prisma.route.findFirst({
    where: {
      OR: [
        { cityAId: fromId, cityBId: toId },
        { cityAId: toId, cityBId: fromId },
      ],
    },
  });

  if (!route)
    throwError("No route found between the cities.", 404);

  const direction =
    route.cityAId === fromId && route.cityBId === toId
      ? "FORWARD"
      : "REVERSE";

  const startOfDay = new Date(parsedDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(parsedDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const pageSize = Number(limit);

  const schedules = await prisma.busSchedule.findMany({
    take: pageSize + 1,
    ...(cursor && {
      cursor: { id: Number(cursor) },
      skip: 1,
    }),
    where: {
      routeId: route.id,
      direction,
      status: "ACTIVE",
      departureTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: { departureTime: "asc" },
    include: {
      bus: {
        select: {
          id: true,
          busNumber: true,
          busType: true,
          operator: {
            select: {
              name: true,
            },
          },
        },
      },
      route: {
        select: {
          distanceKm: true,
          cityA: { select: { name: true } },
          cityB: { select: { name: true } },
        },
      },
    },
  });

  let nextCursor = null;
  if (schedules.length > pageSize) {
    nextCursor = schedules.pop().id;
  }

  const formattedSchedules = schedules.map((schedule) => {
    const isForward = schedule.direction === "FORWARD";

    return {
      id: schedule.id,
      busId: schedule.bus.id,
      busNumber: schedule.bus.busNumber,
      busType: schedule.bus.busType,
      operatorName: schedule.bus.operator?.name || "Unknown Operator",
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      basePrice: schedule.basePrice,
      distanceKm: schedule.route.distanceKm,
      fromCity: isForward
        ? schedule.route.cityA.name
        : schedule.route.cityB.name,
      toCity: isForward
        ? schedule.route.cityB.name
        : schedule.route.cityA.name,
    };
  });

  return { schedules: formattedSchedules, nextCursor };
};

export const getSingleBusSchedulesService = async ({
  userId,
  busId,
  limit = 10,
  cursor,
}) => {

  const operator = await prisma.operator.findFirst({
    where: { userId: Number(userId) },
  });
  if (!operator) throwError("Operator profile not found.", 404);

  const bus = await prisma.bus.findFirst({
    where: {
      id: Number(busId),
      operatorId: operator.id,
    },
  });

  if (!bus)
    throwError("Bus not found or does not belong to you.", 403);

  const pageSize = Number(limit);

  const schedules = await prisma.busSchedule.findMany({
    take: pageSize + 1,
    ...(cursor && {
      cursor: { id: Number(cursor) },
      skip: 1,
    }),
    where: {
      busId: bus.id,
    },
    orderBy: { id: "asc" },
    include: {
      bus: {
        select: {
          id: true,
          busNumber: true,
          busType: true,
        },
      },
      route: {
        select: {
          cityA: { select: { name: true } },
          cityB: { select: { name: true } },
        },
      },
    },
  });

  let nextCursor = null;
  if (schedules.length > pageSize) {
    nextCursor = schedules.pop().id;
  }

  const formattedSchedules = schedules.map((schedule) => {
    const isForward = schedule.direction === "FORWARD";

    return {
      id: schedule.id,
      busId: schedule.bus.id,
      busNumber: schedule.bus.busNumber,
      busType: schedule.bus.busType,
      status: schedule.status,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      basePrice: schedule.basePrice,
      from: isForward
        ? schedule.route.cityA.name
        : schedule.route.cityB.name,
      to: isForward
        ? schedule.route.cityB.name
        : schedule.route.cityA.name,
    };
  });

  return {
    schedules: formattedSchedules,
    nextCursor,
    busNumber: bus.busNumber,
  };
};

export const cancelBusScheduleService = async ({
  userId,
  scheduleId,
}) => {

  const operator = await prisma.operator.findFirst({
    where: { userId: Number(userId) },
  });
  if (!operator) throwError("Operator profile not found.", 404);

  const schedule = await prisma.busSchedule.findFirst({
    where: {
      id: Number(scheduleId),
      bus: { operatorId: operator.id },
    },
  });

  if (!schedule)
    throwError("Schedule not found or not authorized.", 404);

  if (schedule.status !== "ACTIVE")
    throwError("Only active schedules can be cancelled.", 400);

  if (schedule.departureTime <= new Date())
    throwError("Cannot cancel a trip that has already started.", 400);

  await prisma.busSchedule.update({
    where: { id: schedule.id },
    data: { status: "CANCELLED" },
  });

  return { message: "Schedule cancelled successfully." };
};