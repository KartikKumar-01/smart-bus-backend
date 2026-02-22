import { Router } from "express";
import {
  adminLoginController,
  getAllUsersController,
  deleteUserController,
  addOperatorController,
  deleteOperatorController,
  uploadOperatorLogoController,
  changeUserRoleController,
} from "./admin.controller.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../middleware/roleMiddleware.js";
import upload from "../../middleware/multer.js";

const router = Router();
const isAdmin = authorizeRoles("ADMIN");

router.post("/login", adminLoginController);

router.use(authMiddleware);
router.use(isAdmin);

router.get("/users", getAllUsersController);
router.delete("/users/:id", deleteUserController);

router.post("/operators", upload.single("image"), addOperatorController);
router.delete("/operators/:id", deleteOperatorController);
router.patch("/operators/:id/logo", upload.single("image"), uploadOperatorLogoController);

router.patch("/users/:id/role", changeUserRoleController);

export default router;
