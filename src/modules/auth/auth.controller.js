import throwError from "../../utils/error.js";
import { loginUserService, registerUserService } from "./auth.service.js";

export const registerUserController = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throwError("Name, email and password are required.", 400);
    }

    const user = await registerUserService({ name, email, password });

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please log in.",
      user
    });
  } catch (error) {
    next(error);
  }
};

export const loginUserController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throwError("Email and password are required.", 400);
    }

    const { user, accessToken, refreshToken } = await loginUserService({
      email,
      password,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.ENV_TYPE === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};
