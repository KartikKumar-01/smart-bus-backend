import prisma from "../../config/db.js";
import redis from "../../config/redis.js";
import throwError from "../../utils/error.js";
import { releaseSeatLocks } from "./releaseLock.js";
import { validateSeatLocks } from "./validateLocking.js";

export const validateSeatsBeforeLock = async (scheduleId, seatNumbers) => {
  const schedule = await prisma.busSchedule.findUnique({
    where: { id: scheduleId },
    select: {
      id: true,
      busId: true,
      status: true,
    },
  });

  if (!schedule) {
    throwError("Schedule not found", 404);
  }

  if (schedule.status !== "ACTIVE") {
    throwError("Schedule is not active", 400);
  }

  const seats = await prisma.seat.findMany({
    where: {
      busId: schedule.busId,
      seatNumber: { in: seatNumbers },
    },
    select: {
      id: true,
      seatNumber: true,
    },
  });

  if (seats.length !== seatNumbers.length) {
    throwError("Some seats do not exist for this bus", 400);
  }

  const seatIdMap = new Map();
  seats.forEach((seat) => {
    seatIdMap.set(seat.seatNumber, seat.id);
  });

  const seatIds = seats.map((seat) => seat.id);

  const alreadyBooked = await prisma.bookingSeat.findMany({
    where: {
      scheduleId,
      seatId: { in: seatIds },
      booking: {
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
      },
    },
    select: { seatId: true },
  });

  if (alreadyBooked.length > 0) {
    const bookedSeatNumbers = alreadyBooked.map(
      (b) => [...seatIdMap.entries()].find(([_, id]) => id === b.seatId)[0],
    );

    throwError(`Seats already booked: ${bookedSeatNumbers.join(", ")}`, 400);
  }

  return {
    schedule,
    seats,
    seatIds,
  };
};

export const getSeatPlanService = async (scheduleId) => {
  const schedule = await prisma.busSchedule.findUnique({
    where: { id: scheduleId },
    select: {
      id: true,
      busId: true,
      status: true,
    },
  });

  if (!schedule) {
    throwError("Schedule not found", 404);
  }

  if (schedule.status === "CANCELLED") {
    throwError("Schedule is cancelled", 400);
  }

  const seats = await prisma.seat.findMany({
    where: { busId: schedule.busId },
    select: {
      id: true,
      seatNumber: true,
      seatType: true,
    },
    orderBy: { seatNumber: "asc" },
  });

  const bookedSeats = await prisma.bookingSeat.findMany({
    where: {
      scheduleId,
      booking: {
        status: {
          in: ["CONFIRMED", "PENDING"],
        },
      },
    },
    select: { seatId: true },
  });

  const bookedSeatIdSet = new Set(bookedSeats.map((s) => s.seatId));

  const lockedSeatNumberSet = new Set();
  const pattern = `seat_lock:${scheduleId}:*`;

  let cursor = "0";

  do {
    const result = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);

    cursor = result[0];
    const keys = result[1];

    for (const key of keys) {
      const parts = key.split(":");
      const seatNumber = parseInt(parts[2], 10);
      if (!isNaN(seatNumber)) {
        lockedSeatNumberSet.add(seatNumber);
      }
    }
  } while (cursor !== "0");

  const seatPlan = seats.map((seat) => {
    if (bookedSeatIdSet.has(seat.id)) {
      return {
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        status: "BOOKED",
      };
    }

    if (lockedSeatNumberSet.has(seat.seatNumber)) {
      return {
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        status: "LOCKED",
      };
    }

    return {
      seatNumber: seat.seatNumber,
      seatType: seat.seatType,
      status: "AVAILABLE",
    };
  });

  return seatPlan;
};

export const createBookingService = async (
  userId,
  scheduleId,
  seatNumbers,
  totalPrice,
  paymentOption,
) => {
  const schedule = await prisma.busSchedule.findFirst({
    where: {
      id: scheduleId,
    },
    include: { bus: true },
  });
  if (!schedule) throwError("Schedule not found.", 404);
  if (schedule.status !== "ACTIVE") throwError("Schedule not active.", 400);

  await validateSeatLocks(userId, schedule.id, seatNumbers);

  const now = new Date();

  if (now >= schedule.departureTime)
    throwError("Cannot book completed bus schedules.");
  const departure = new Date(schedule.departureTime);
  const twoHours = 2 * 60 * 60 * 1000;

  let status = "CONFIRM";
  let expiresAt = null;

  if (paymentOption === "PAY_LATER") {
    if (departure - now <= twoHours) {
      throwError(
        "Pay later allowed only if departure is more than 2 hours away",
        400,
      );
    }

    status = "PENDING";
    expiresAt = new Date(now.getTime() + twoHours);
  }

  const booking = await prisma.$transaction(async (tx) => {
    const seats = await prisma.seat.findMany({
      where: {
        busId: schedule.busId,
        seatNumber: { in: seatNumbers },
      },
    });

    const seatIds = seats.map((seat) => seat.id);

    const alreadyBooked = await prisma.bookingSeat.findMany({
      where: {
        scheduleId,
        seatId: { in: seatIds },
      },
    });

    if (alreadyBooked.length > 0)
      throwError("Some seats are already booked.", 400);

    const newBooking = await prisma.booking.create({
      data: {
        userId,
        scheduleId,
        totalPrice,
        status,
        expiresAt,
      },
    });

    await prisma.bookingSeat.createMany({
      data: seatIds.map((seatId) => ({
        bookingId: newBooking.id,
        scheduleId,
        seatId,
      })),
    });

    return newBooking;
  });

  await releaseSeatLocks(scheduleId, seatNumbers);

  return booking;
};

export const getAllBookingsService = async (
  userId,
  cursor,
  limit = 5,
) => {
  let whereClause = { userId };

  let cursorFilter = {};

  if (cursor) {
    const [departureTime, bookingId] = cursor.split("_");

    cursorFilter = {
      OR: [
        {
          schedule: {
            departureTime: { lt: new Date(departureTime) },
          },
        },
        {
          schedule: {
            departureTime: new Date(departureTime),
          },
          id: { lt: Number(bookingId) },
        },
      ],
    };
  }

  const bookings = await prisma.booking.findMany({
    where: {
      ...whereClause,
      ...cursorFilter,
    },

    include: {
      schedule: {
        include: {
          route: {
            include: {
              cityA: { select: { name: true } },
              cityB: { select: { name: true } },
            },
          },
          bus: {
            select: {
              busNumber: true,
              busType: true,
            },
          },
        },
      },
      bookingSeats: {
        include: {
          seat: { select: { seatNumber: true } },
        },
      },
    },

    orderBy: [
      {
        schedule: { departureTime: "desc" },
      },
      {
        id: "desc",
      },
    ],

    take: limit + 1,
  });

  let nextCursor = null;

  if (bookings.length > limit) {
    const nextItem = bookings[limit - 1];

    nextCursor = `${nextItem.schedule.departureTime.toISOString()}_${nextItem.id}`;

    bookings.pop();
  }

  const formatted = bookings.map((booking) => ({
    bookingId: booking.id,
    status: booking.status,
    totalPrice: booking.totalPrice,

    from: booking.schedule.route.cityA.name,
    to: booking.schedule.route.cityB.name,

    busNumber: booking.schedule.bus.busNumber,
    busType: booking.schedule.bus.busType,

    departureTime: booking.schedule.departureTime,
    arrivalTime: booking.schedule.arrivalTime,

    seats: booking.bookingSeats.map((bs) => bs.seat.seatNumber),
  }));

  return {
    data: formatted,
    nextCursor,
  };
};
