import throwError from "../../utils/error.js";
import { createRouteService, getRoutesService, searchRouteService } from "./bus-routes.service.js";

export const getRoutesController = async (req, res) => {
  try {
    const routes = await getRoutesService();
    return res.status(200).json({
      success: true,
      message: "Routes fetched successfully.",
      routes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error.",
      routes,
    });
  }
};

export const createRouteController = async (req, res) => {
  try {
    const { cityAId, cityBId, distanceKm, durationMinutes } = req.body;

    if (!cityAId || !cityBId || !distanceKm || !durationMinutes) {
      throwError("Required fields are missing.", 400);
    }

    const route = await createRouteService({ cityAId, cityBId, 
      distanceKm: Number(distanceKm),
      durationMinutes: Number(durationMinutes),
     });

    return res.status(201).json({
      success: true,
      message: "Route created successfully.",
      route,
    });

  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server Error." : error.message,
    });
  }
};

export const searchRouteController = async (req, res) => {
  try {
    const { cityAId, cityBId } = req.query;

    if (!cityAId || !cityBId) {
      throwError("Both cityAId and cityBId are required.", 400);
    }

    const route = await searchRouteService({
      cityAId: Number(cityAId),
      cityBId: Number(cityBId),
    });

    return res.status(200).json({
      success: true,
      route,
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode === 500 ? "Server Error." : error.message,
    });
  }
};
