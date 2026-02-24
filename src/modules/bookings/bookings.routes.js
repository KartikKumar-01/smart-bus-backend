import { Router, application } from "express";
import { authorizeRoles } from "../../middleware/roleMiddleware.js";
import { createBookingController, getAllBookingsController, getSeatPlanController, lockSeatsController } from "./bookings.controller.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get('/', authorizeRoles("USER", "OPERATOR", "ADMIN"), getAllBookingsController)
router.get('/seat-plan/:scheduleId', authorizeRoles("USER", "OPERATOR", "ADMIN"), getSeatPlanController)
router.post('/lock-seats', authorizeRoles("USER"), lockSeatsController)
router.post('/create', authorizeRoles("USER"), createBookingController);

export default router