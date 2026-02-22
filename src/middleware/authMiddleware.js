import jwt from "jsonwebtoken";
import throwError from "../utils/error.js";

export const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throwError("Access token not provided.", 401);
    }

    const token = header.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};