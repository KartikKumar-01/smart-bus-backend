import redis from "../../config/redis.js";

export const releaseSeatLocks = async (scheduleId, seatNumbers) => {
    const pipeline = redis.pipeline();
  
    for (const seatNumber of seatNumbers) {
      const key = `seat_lock:${scheduleId}:${seatNumber}`;
      pipeline.del(key);
    }
  
    await pipeline.exec();
  };