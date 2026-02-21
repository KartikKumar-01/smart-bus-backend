import {
  addCityService,
  getCitiesService,
  removeCityService,
} from "./cities.service.js";

export const addCityController = async (req, res) => {
  try {
    const { cityName, state } = req.body;
    if (!cityName || !state) {
      return res.status(400).json({
        success: false,
        message: "City and state are required.",
      });
    }
    const result = await addCityService(cityName, state);
    return res.status(201).json({
      success: true,
      message: `${result.name}, ${result.state} added successfully.`,
      result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error.",
    });
  }
};

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

export const removeCityController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "City ID is required.",
      });
    }

    const deletedCity = await removeCityService(Number(id));

    return res.status(200).json({
      success: true,
      message: `${deletedCity.name} removed successfully.`,
    });

  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server error.",
    });
  }
};