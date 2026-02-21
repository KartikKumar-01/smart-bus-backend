import { Router } from "express";
import { createRouteController, getRoutesController, searchRouteController } from "./bus-routes.controller.js";

const router = Router()

router.get('/', getRoutesController);
router.post('/add', createRouteController);
router.get("/search", searchRouteController);

export default router;