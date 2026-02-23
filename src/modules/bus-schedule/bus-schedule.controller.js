import throwError from "../../utils/error.js";
import {
  addBusScheduleService,
  getAllBusesSchedulesService,
  getSpecificBusSchedulesService,
} from "./bus-schedule.service.js";

export const addBusScheduleController = async (req, res) => {
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
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getAllBusesSchedulesController = async (req, res) => {
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
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getSpecificBusSchedulesController = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) throwError("Please login first.", 401);

    const { limit, cursor } = req.query;
    const { fromCityId, toCityId } = req.body;

    if (!fromCityId || !toCityId) throwError("Both cities are required.", 400);
    if (Number(fromCityId) === Number(toCityId))
      throwError("Both cities cannot be same.", 400);

    const { schedules, nextCursor } = await getSpecificBusSchedulesService({
      userId,
      fromCityId,
      toCityId,
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
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
