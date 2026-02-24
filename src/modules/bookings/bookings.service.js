import prisma from "../../config/db.js";
import throwError from "../../utils/error.js";

export const validateSeatsBeforeLock = async (
  scheduleId,
  seatNumbers
) => {
  const schedule = await prisma.busSchedule.findUnique({
    where: { id: scheduleId },
    select: {
      id: true,
      busId: true,
      status: true
    }
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
      seatNumber: { in: seatNumbers }
    },
    select: {
      id: true,
      seatNumber: true
    }
  });

  if (seats.length !== seatNumbers.length) {
    throwError("Some seats do not exist for this bus", 400);
  }

  const seatIdMap = new Map();
  seats.forEach(seat => {
    seatIdMap.set(seat.seatNumber, seat.id);
  });

  const seatIds = seats.map(seat => seat.id);

  const alreadyBooked = await prisma.bookingSeat.findMany({
    where: {
      scheduleId,
      seatId: { in: seatIds },
      booking: {
        status: {
          in: ["CONFIRMED", "PENDING"]
        }
      }
    },
    select: { seatId: true }
  });

  if (alreadyBooked.length > 0) {
    const bookedSeatNumbers = alreadyBooked.map(b =>
      [...seatIdMap.entries()]
        .find(([_, id]) => id === b.seatId)[0]
    );

    throwError(
      `Seats already booked: ${bookedSeatNumbers.join(", ")}`,
      400
    );
  }

  return {
    schedule,
    seats,
    seatIds
  };
};