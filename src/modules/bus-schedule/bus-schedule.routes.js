import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { addBusScheduleController, getAllBusesSchedulesController, getSpecificBusSchedulesController } from "./bus-schedule.controller.js";
import { authorizeRoles } from "../../middleware/roleMiddleware.js";


const router = Router();

router.use(authMiddleware);

router.get('/search', authorizeRoles("USER"), getSpecificBusSchedulesController)

router.use(authorizeRoles("OPERATOR", "ADMIN"));

router.get("/", getAllBusesSchedulesController);
router.post("/add", addBusScheduleController);


export default router;
