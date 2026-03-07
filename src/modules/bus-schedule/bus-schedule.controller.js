import throwError from "../../utils/error.js";
import {
  addBusScheduleService,
  getAllBusesSchedulesService,
  getSingleBusSchedulesService,
  searchBusSchedulesService,
} from "./bus-schedule.service.js";

export const addBusScheduleController = async (req, res, next) => {
  try {
    const {
      busId,
      fromCityId,
      toCityId,
      departureTime,
      arrivalTime,
      basePrice,
    } = req.body;

    const userId = req.user?.id;

    if (
      !busId ||
      !fromCityId ||
      !toCityId ||
      !departureTime ||
      !arrivalTime ||
      !basePrice
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const schedule = await addBusScheduleService({
      userId,
      busId,
      fromCityId,
      toCityId,
      departureTime,
      arrivalTime,
      basePrice,
    });

    return res.status(201).json({
      success: true,
      message: "Bus schedule created successfully.",
      schedule,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBusesSchedulesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) throwError("Please login first.", 401);

    const { limit, cursor } = req.query;

    const { schedules, nextCursor } = await getAllBusesSchedulesService({
      userId,
      limit,
      cursor,
    });

    return res.status(200).json({
      success: true,
      message: "Schedules fetched successfully.",
      schedules,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

export const searchBusSchedulesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) throwError("Please login first.", 401);

    const { fromCityId, toCityId, date, limit, cursor } = req.query;

    if (!fromCityId || !toCityId) throwError("Both cities are required.", 400);
    if (!date) throwError("Date is required.", 400);
    if (Number(fromCityId) === Number(toCityId))
      throwError("Both cities cannot be same.", 400);

    const { schedules, nextCursor } = await searchBusSchedulesService({
      userId,
      fromCityId,
      toCityId,
      date,
      limit,
      cursor,
    });

    return res.status(200).json({
      success: true,
      message: "Schedules fetched successfully.",
      schedules,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleBusSchedulesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) throwError("Please login first.", 401);

    const { limit, cursor } = req.query;
    const { busId } = req.params

    const { schedules, nextCursor, busNumber } = await getSingleBusSchedulesService({
      userId,
      busId,
      limit,
      cursor,
    });

    return res.status(200).json({
      success: true,
      message: `Schedules fetched successfully for bus: ${busNumber}.`,
      schedules,
      nextCursor,
    });
  } catch (error) {
    next(error);
  }
};