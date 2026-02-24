import throwError from "../../utils/error.js";
import { validateSeatsBeforeLock } from "./bookings.service.js";
import { lockSeats } from "./seatLocking.redis.js";

export const lockSeatsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scheduleId, seatNumbers } = req.body;

    if (!scheduleId) {
      throwError("ScheduleId is required", 400);
    }
    if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      throwError("seatNumbers must be a non-empty array", 400);
    }

    await validateSeatsBeforeLock(scheduleId, seatNumbers);

    const result = await lockSeats(userId, scheduleId, seatNumbers);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Locking failed." : error.message,
    });
  }
};
