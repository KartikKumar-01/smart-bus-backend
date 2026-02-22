import { Router } from "express";
import { loginUserController, registerUserController } from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "../../utils/auth.validation.js";

const router = Router();

router.post('/register', validate(registerSchema), registerUserController);
router.post('/login', validate(loginSchema), loginUserController)

export default router;