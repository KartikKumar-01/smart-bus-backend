import redis from "../../config/redis";

export const validateSeatLocks = async (userId, scheduleId, seatNumbers) => {
  for (const seatNumber of seatNumbers) {
    const key = `seat_lock:${scheduleId}:${seatNumber}`;

    const lockedBy = await redis.get(key);

    if (lockedBy !== String(userId)) {
      throwError(`Seat ${seatNumber} lock expired or not owned by you`, 400);
    }
  }
};
