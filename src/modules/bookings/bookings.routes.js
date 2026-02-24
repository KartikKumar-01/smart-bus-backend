import { Router, application } from "express";
import { authorizeRoles } from "../../middleware/roleMiddleware.js";
import { lockSeatsController } from "./bookings.controller.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.post('/lock-seats', authorizeRoles("USER"), lockSeatsController)

export default router