import {
  addCityService,
  addStateService,
  getAllStatesService,
  getCitiesService,
  removeCityService,
  uploadCityImageService,
} from "./cities.service.js";

export const getCitiesController = async (req, res) => {
  try {
    const { q } = req.query;

    const { cities, message } = await getCitiesService(q);
    return res.status(200).json({
      success: true,
      message: message,
      cities,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error.",
    });
  }
};

export const addStateController = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      throwError("State name is required.", 400);
    }

    const state = await addStateService(name.trim());
    return res.status(201).json({
      success: true,
      message: `State ${state.name} added successfully.`,
      state,
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};

export const getAllStatesController = async (req, res) => {
  try {
    const states = await getAllStatesService();
    return res.status(200).json({
      success: true,
      message: "States fetched successfully.",
      states,
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};

// 5. City Management
export const addCityController = async (req, res) => {
  try {
    const { cityName, stateId } = req.body;
    const image = req.file ? req.file : null;

    if (!cityName || !stateId) {
      throwError("City name and state ID are required.", 400);
    }

    const city = await addCityService({
      cityName: cityName.trim(),
      stateId,
      image,
    });
    return res.status(201).json({
      success: true,
      message: `City ${city.name} added successfully.`,
      city,
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};

export const removeCityController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      throwError("Valid city ID is required.", 400);
    }

    const deleted = await removeCityService(Number(id));
    return res.status(200).json({
      success: true,
      message: `City ${deleted.name} removed successfully.`,
      deleted,
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};

// 6. Upload City Image
export const uploadCityImageController = async (req, res) => {
  try {
    const { id } = req.params;
    const image = req.file;

    if (!id || isNaN(id)) {
      throwError("Valid city ID is required.", 400);
    }

    if (!image) {
      throwError("Image is required.", 400);
    }

    const city = await uploadCityImageService(Number(id), image);
    return res.status(200).json({
      success: true,
      message: "City image uploaded successfully.",
      city,
    });
  } catch (error) {
    console.log(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};
