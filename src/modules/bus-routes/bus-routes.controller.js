import throwError from "../../utils/error.js";
import { createRouteService, getRoutesService, searchRouteService } from "./bus-routes.service.js";

export const getRoutesController = async (req, res, next) => {
  try {
    const routes = await getRoutesService();
    return res.status(200).json({
      success: true,
      message: "Routes fetched successfully.",
      routes,
    });
  } catch (error) {
    next(error);
  }
};

export const createRouteController = async (req, res, next) => {
  try {
    const { cityAId, cityBId, distanceKm, durationMinutes } = req.body;

    if (!cityAId || !cityBId || !distanceKm || !durationMinutes) {
      throwError("Required fields are missing.", 400);
    }

    const route = await createRouteService({
      cityAId, cityBId,
      distanceKm: Number(distanceKm),
      durationMinutes: Number(durationMinutes),
    });

    return res.status(201).json({
      success: true,
      message: "Route created successfully.",
      route,
    });

  } catch (error) {
    next(error);
  }
};

export const searchRouteController = async (req, res, next) => {
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
    next(error);
  }
};
