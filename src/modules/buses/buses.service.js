import prisma from "../../config/db.js";
import throwError from "../../utils/error.js";

export const addBusService = async ({
  userId,
  busNumber,
  totalSeats,
  busType,
  busModel
}) => {
  const id = Number(userId);

  if (!id) throwError("Invalid user ID.", 400);

  const operator = await prisma.operator.findUnique({
    where: { userId: id },
  });

  if (!operator) {
    throwError("Operator profile not found.", 404);
  }

  if (!totalSeats || totalSeats <= 0) {
    throwError("Total seats must be greater than 0.", 400);
  }

  const allowedTypes = ["NON_AC", "AC", "SLEEPER"];

  if (!allowedTypes.includes(busType)) {
    throwError("Invalid bus type.", 400);
  }

  if (!busNumber) {
    throwError("Bus number is required.", 400);
  }

  busNumber = busNumber.trim().toUpperCase();

  if (busNumber.includes("-")) {
    throwError("Bus number cannot contain hyphens.", 400);
  }

  if (busNumber.length !== 10) {
    throwError("Bus number must be exactly 10 characters.", 400);
  }

  const existingBus = await prisma.bus.findUnique({
    where: { busNumber },
  });

  if (existingBus) {
    throwError("Bus number already exists.", 409);
  }

  const bus = await prisma.$transaction(async (tx) => {
    const createdBus = await tx.bus.create({
      data: {
        operatorId: operator.id,
        busNumber,
        totalSeats,
        busType: busType,
        busModel
      },
    });

    const seatType = busType === "SLEEPER" ? "SLEEPER" : "SEATER";
    const seatsData = [];

    for (let i = 1; i <= totalSeats; i++) {
      seatsData.push({
        busId: createdBus.id,
        seatNumber: i,
        seatType,
      });
    }

    await tx.seat.createMany({
      data: seatsData,
    });

    return createdBus;
  });

  return prisma.bus.findUnique({
    where: { id: bus.id },
    include: {
      operator: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export const getBusListService = async ({ userId }) => {
  const operator = await prisma.operator.findUnique({
    where: {
      userId: Number(userId),
    },
    select: {
      id: true,
      name: true,
      rating: true,
      logoUrl: true,
    },
  });

  if (!operator) {
    throwError("Operator not found.", 404);
  }

  const buses = await prisma.bus.findMany({
    where: {
      operatorId: operator.id,
    },
    select: {
      id: true,
      operatorId: true,
      busNumber: true,
      busType: true,
      busModel: true,
      totalSeats: true,
    },
    orderBy: {
      id: "desc",
    }
  });

  const formattedBuses = buses.map((bus) => ({
    busId: bus.id,
    operatorId: bus.operatorId,
    busNumber: bus.busNumber,
    busType: bus.busType,
    busModel: bus.busModel,
    totalSeats: bus.totalSeats,
    operatorLogoUrl: operator.logoUrl,
  }));

  return {
    operator: {
      name: operator.name,
      rating: operator.rating,
      logoUrl: operator.logoUrl,
    },
    buses: formattedBuses,
  };
};

export const removeBusService = async ({ userId, busId }) => {
  const operator = await prisma.operator.findUnique({
    where: {
      userId: Number(userId),
    },
  });

  if (!operator) {
    throwError("Operator not found.", 404);
  }

  const bus = await prisma.bus.findUnique({
    where: {
      id: Number(busId),
    },
    include: {
      schedules: true,
    },
  });

  if (!bus) throwError("Bus not found.", 404);
  if (bus.operatorId !== operator.id)
    throwError(`Bus ${bus.busNumber} does not belong to you.`, 403);
  if (bus.schedules.length > 0)
    throwError("Bus cannot be removed as it has schedules.", 400);

  const removedBus = await prisma.$transaction(async (tx) => {
    await tx.seat.deleteMany({
      where: {
        busId: bus.id,
      },
    });
    return tx.bus.delete({
      where: {
        id: bus.id,
      },
    });
  });
  return removedBus;
};
