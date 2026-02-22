import throwError from "../../utils/error.js";
import {
  addBusService,
  getBusListService,
  removeBusService,
} from "./buses.service.js";

export const addBusController = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) throwError("Login first.", 401);

    const { busNumber, totalSeats, busType } = req.body;
    if (!busNumber || !totalSeats || !busType)
      throwError("All fields are required.", 400);

    const bus = await addBusService({ userId, busNumber, totalSeats, busType });
    return res.status(201).json({
      success: true,
      message: "Bus added successfully.",
      bus,
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error." : error.message,
    });
  }
};

export const getBusListController = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) throwError("Please login first.", 404);

    const buses = await getBusListService({ userId });

    return res.status(200).json({
      success: true,
      message: "Buses fetched successfully",
      buses,
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error." : error.message,
    });
  }
};

export const removeBusController = async (req, res) => {
  const userId = req.user.id;
  if (!userId) throwError("Please login first.", 404);

  const busId = req.params.id;
  if (!busId) throwError("Bus id is required.", 400);

  const removedBus = await removeBusService({ userId, busId });
  return res.status(200).json({
    success: true,
    message: `Bus with number: ${removedBus.busNumber} removed successfully.`,
    removedBus,
  });
};
