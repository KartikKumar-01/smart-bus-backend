import { Router } from "express";
import { addCityController, addCityImageController, getCitiesController } from "./cities.controller.js";
import upload from "../../middleware/multer.js";

const router = Router();

router.get("/", getCitiesController);
router.post("/add", upload.single("image"), addCityController);
router.patch("/add-image/:cityId", upload.single("image"), addCityImageController);

export default router