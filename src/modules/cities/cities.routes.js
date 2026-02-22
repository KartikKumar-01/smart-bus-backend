import { Router } from "express";
import { addCityController, addStateController, getAllStatesController, getCitiesController, removeCityController, uploadCityImageController } from "./cities.controller.js";
import { authorizeRoles } from "../../middleware/roleMiddleware.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import upload from "../../middleware/multer.js";

const router = Router();

router.use(authMiddleware);
router.get("/", authorizeRoles("ADMIN", "OPERATOR", "USER"), getCitiesController);

router.get("/states", getAllStatesController);
router.post("/states/add", authorizeRoles("ADMIN"), addStateController);

router.post("/add", authorizeRoles("ADMIN"), upload.single("image"), addCityController);
router.delete("/remove/:id", authorizeRoles("ADMIN"), removeCityController);

router.patch("/:id/image", authorizeRoles("ADMIN"), upload.single("image"), uploadCityImageController);

export default router;