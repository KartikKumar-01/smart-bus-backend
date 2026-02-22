import { Router } from "express";
import { createRouteController, getRoutesController, searchRouteController } from "./bus-routes.controller.js";
import { authorizeRoles } from "../../middleware/roleMiddleware.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";

const router = Router()

router.use(authMiddleware);

router.get('/', authorizeRoles("USER", "OPERATOR", "ADMIN") , getRoutesController);
router.post('/add', authorizeRoles("OPERATOR", "ADMIN") , createRouteController);
router.get("/search", authorizeRoles("USER", "OPERATOR", "ADMIN") , searchRouteController);

export default router;