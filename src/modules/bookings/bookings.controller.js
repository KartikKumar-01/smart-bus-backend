import throwError from "../../utils/error.js";
import {
  createBookingService,
  getAllBookingsService,
  getSeatPlanService,
  validateSeatsBeforeLock,
} from "./bookings.service.js";
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

export const getSeatPlanController = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    console.log("User role:", req.user.role);
    if (!scheduleId) throwError("Select a schedule to view seat plan.", 400);

    const seatPlan = await getSeatPlanService(Number(scheduleId));

    return res.status(200).json({
      success: true,
      message: "Seat plan fetched successfully.",
      seatPlan,
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};

export const createBookingController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { scheduleId, seatNumbers, totalPrice, paymentOption } = req.body;
    if (!scheduleId || !seatNumbers || !totalPrice || !paymentOption)
      throwError("Required fields are missing.", 400);

    const booking = await createBookingService(
      Number(userId),
      Number(scheduleId),
      seatNumbers,
      Number(totalPrice),
      paymentOption,
    );

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode === 500 ? "Booking not created." : error.message,
    });
  }
};

export const getAllBookingsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const {cursor, limit} = req.query;

    const bookings = await getAllBookingsService(Number(userId), cursor, limit);

    return res.status(201).json({
      success: true,
      message: "Bookings fetched successfully",
      bookings,
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode === 500 ? "Booking not created." : error.message,
    });
  }
};
