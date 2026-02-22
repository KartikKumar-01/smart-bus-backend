import throwError from "../../utils/error.js";
import {
  adminLoginService,
  getAllUsersService,
  deleteUserService,
  addOperatorService,
  deleteOperatorService,
  uploadOperatorLogoService,
  changeUserRoleService,
} from "./admin.service.js";

// 1. Admin Login
export const adminLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throwError("Email and password are required.", 400);
    }

    const { user, accessToken, refreshToken } = await adminLoginService({
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
      message: "Admin login successful.",
      accessToken,
      user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};

// 2. User Management
export const getAllUsersController = async (req, res) => {
  try {
    const users = await getAllUsersService();
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      users,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};

export const deleteUserController = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    if (!id || isNaN(id)) {
      throwError("Valid user ID is required.", 400);
    }

    const deleted = await deleteUserService(Number(id), adminId);
    return res.status(200).json({
      success: true,
      message: `User ${deleted.name} deleted successfully.`,
      deleted,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};

// 3. Operator Management
export const addOperatorController = async (req, res) => {
  try {
    const { name, email, password, contactInfo } = req.body;
    const image = req.file ? req.file : null;

    if (!name || !email || !password) {
      throwError("Name, email and password are required.", 400);
    }

    const operator = await addOperatorService({ name, email, password, contactInfo, image });
    return res.status(201).json({
      success: true,
      message: "Operator created successfully.",
      operator,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};

export const deleteOperatorController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      throwError("Valid operator ID is required.", 400);
    }

    const deleted = await deleteOperatorService(Number(id));
    return res.status(200).json({
      success: true,
      message: `Operator ${deleted.name} deleted successfully.`,
      deleted,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};

// 3b. Upload Operator Logo (separate update endpoint)
export const uploadOperatorLogoController = async (req, res) => {
  try {
    const { id } = req.params;
    const image = req.file;

    if (!id || isNaN(id)) {
      throwError("Valid operator ID is required.", 400);
    }

    if (!image) {
      throwError("Image is required.", 400);
    }

    const operator = await uploadOperatorLogoService(Number(id), image);
    return res.status(200).json({
      success: true,
      message: "Operator logo uploaded successfully.",
      operator,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};

// 4. State Management

// 7. Change User Role
export const changeUserRoleController = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user?.id;

    if (!id || isNaN(id)) {
      throwError("Valid user ID is required.", 400);
    }

    if (!role || !["USER", "OPERATOR", "ADMIN"].includes(role)) {
      throwError("Valid role (USER, OPERATOR, ADMIN) is required.", 400);
    }

    const user = await changeUserRoleService(Number(id), role, adminId);
    return res.status(200).json({
      success: true,
      message: `User role updated to ${user.role}.`,
      user,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 500 ? "Server error" : error.message,
    });
  }
};
