import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../middleware/roleMiddleware.js";
import { addBusController, getBusListController, removeBusController } from "./buses.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(authorizeRoles("OPERATOR", "ADMIN"));

router.get("/", getBusListController);
router.post("/add", addBusController);
router.post("/remove/:id", removeBusController)

export default router;
