import redis from "../../config/redis.js";
import throwError from "../../utils/error.js";

const lock_TTL = 300;

export const lockSeats = async (userId, scheduleId, seatNumbers) => {
    const lockedSeats = []

    for(const seatNumber of seatNumbers){
        const key = `seat_lock:${scheduleId}:${seatNumber}`
        const result = await redis.set(key, userId, "NX", "EX", lock_TTL);

        if(!result) lockedSeats.push(seatNumber);
    }

    if(lockedSeats.length > 0){
        throwError(`Seats already locked: ${lockedSeats.join(", ")}`, 400)
    }

    return {
        message: "Seats locked for 5 minutes."
    }
}