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

  if (!operator) {
    throwError("Operator profile not found.", 404);
  }

  const bus = await prisma.bus.findUnique({
    where: {
      id: Number(busId),
    },
  });

  if (!bus) throwError("Bus not found.", 404);
  if (bus.operatorId !== operator.id)
    throwError("This bus does not belong to you.", 403);

  const route = await prisma.route.findFirst({
    where: {
      OR: [
        { cityAId: Number(fromCityId), cityBId: Number(toCityId) },
        { cityAId: Number(toCityId), cityBId: Number(fromCityId) },
      ],
    },
  });

  if (!route) throwError("No route between the cities. Create one first.", 404);

  let direction;
  if (
    route.cityAId === Number(fromCityId) &&
    route.cityBId === Number(toCityId)
  ) {
    direction = "FORWARD";
  } else {
    direction = "REVERSE";
  }

  const depTime = new Date(departureTime);
  const arrTime = new Date(arrivalTime);

  if (isNaN(depTime) || isNaN(arrTime)) {
    throwError("Invalid date format.", 400);
  }
  if (depTime >= arrTime) throwError("Arrival must be after departure.", 400);

  const overlappingSchedule = await prisma.busSchedule.findFirst({
    where: {
      busId: bus.id,
      AND: [
        {
          departureTime: {
            lt: arrTime,
          },
        },
        {
          arrivalTime: {
            gt: depTime,
          },
        },
      ],
    },
  });

  if (overlappingSchedule) {
    throwError(
      "This bus is already assigned to another schedule during this time.",
      400,
    );
  }

  const schedule = await prisma.busSchedule.create({
    data: {
      busId: bus.id,
      routeId: route.id,
      direction,
      departureTime: depTime,
      arrivalTime: arrTime,
      basePrice: Number(basePrice),
    },
  });

  return schedule;
};

export const getAllBusesSchedulesService = async ({
  userId,
  limit = 10,
  cursor,
}) => {
  const pageSize = Number(limit);

  const operator = await prisma.operator.findUnique({
    where: {
      userId: Number(userId),
    },
  });
  if (!operator) throwError("Operator profile not found.", 404);

  const schedules = await prisma.busSchedule.findMany({
    take: pageSize + 1,
    ...(cursor && {
      cursor: { id: Number(cursor) },
      skip: 1,
    }),
    where: {
      bus: {
        operatorId: operator.id,
      },
    },
    orderBy: {
      id: "asc",
    },
    include: {
      bus: {
        select: {
          id: true,
          busNumber: true,
        },
      },
      route: {
        select: {
          cityA: {
            select: {
              id: true,
              name: true,
            },
          },
          cityB: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  let nextCursor = null;

  if (schedules.length > pageSize) {
    const nextItem = schedules.pop();
    nextCursor = nextItem.id;
  }

  const formattedSchedules = schedules.map((schedule) => {
    const isForward = schedule.direction === "FORWARD";

    return {
      id: schedule.id,
      busId: schedule.bus.id,
      busNumber: schedule.bus.busNumber,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      basePrice: schedule.basePrice,
      from: isForward ? schedule.route.cityA.name : schedule.route.cityB.name,
      to: isForward ? schedule.route.cityB.name : schedule.route.cityA.name,
    };
  });

  return {
    schedules: formattedSchedules,
    nextCursor,
  };
};

export const getSpecificBusSchedulesService = async ({
  userId,
  fromCityId,
  toCityId,
  limit = 10,
  cursor,
}) => {
  const fromId = Number(fromCityId);
  const toId = Number(toCityId);

  if(fromId === toId) throwError("Both cities cannot be same.", 400);

  const user = await prisma.user.findUnique({
    where: {
      id: Number(userId),
    },
  });

  if (!user) throwError("User not found.", 404);

  const pageSize = Number(limit);

  const route = await prisma.route.findFirst({
    where: {
      OR: [
        { cityAId: fromId, cityBId: toId },
        { cityAId: toId, cityBId: fromId },
      ],
    },
  });

  if (!route) throwError("No route found between the cities.", 404);

  let direction;
  if (
    route.cityAId === Number(fromCityId) &&
    route.cityBId === Number(toCityId)
  ) {
    direction = "FORWARD";
  } else {
    direction = "REVERSE";
  }

  const schedules = await prisma.busSchedule.findMany({
    take: pageSize + 1,
    ...(cursor && {
      cursor: { id: Number(cursor) },
      skip: 1,
    }),
    where: {
      routeId: route.id,
      direction,
    },
    orderBy: {
      id: "asc",
    },
    include: {
      bus: {
        select: {
          id: true,
          busNumber: true,
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
    const nextItem = schedules.pop();
    nextCursor = nextItem.id;
  }
  const formattedSchedules = schedules.map((schedule) => {
    const isForward = schedule.direction === "FORWARD";
    return {
      id: schedule.id,
      busId: schedule.bus.id,
      busNumber: schedule.bus.busNumber,
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      basePrice: schedule.basePrice,
      from: isForward ? schedule.route.cityA.name : schedule.route.cityB.name,
      to: isForward ? schedule.route.cityB.name : schedule.route.cityA.name,
    };
  });


  return {
    schedules: formattedSchedules,
    nextCursor,
  };
};
