import { Router } from "express";
import { addCityController, getCitiesController } from "./cities.controller.js";

const router = Router();

router.get("/", getCitiesController);
router.post("/add", addCityController);

export default router