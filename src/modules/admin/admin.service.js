import prisma from "../../config/db.js";
import throwError from "../../utils/error.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { toCamelCase } from "../../utils/format.js";
import uploadImage from "../../utils/uploadImage.js";
import cloudinary from "../../config/cloudinary.js";
import geocodeCity from "../../utils/geocoding.js";

const ROLES = ["USER", "OPERATOR", "ADMIN"];

export const adminLoginService = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) throwError("Email or password incorrect.", 400);
  if (user.role !== "ADMIN") throwError("Access denied. Admin only.", 403);

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throwError("Email or password incorrect.", 400);

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      imageUrl: user.imageUrl,
    },
    accessToken,
    refreshToken,
  };
};

export const getAllUsersService = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const deleteUserService = async (userId, adminId) => {
  const id = Number(userId);

  const user = await prisma.user.findUnique({
    where: { id },
    include: { 
      bookings: true,
      operatorProfile: {
        include: {
          buses: true,
        },
      },
    },
  });

  if (!user) throwError("User not found.", 404);
  if (id === Number(adminId)) throwError("Cannot delete yourself.", 400);
  if (user.role === "ADMIN") throwError("Cannot delete an ADMIN user.", 400);
  if (user.bookings.length > 0)
    throwError("Cannot delete user with existing bookings.", 400);
  
  // Check if operator has buses
  if (user.operatorProfile && user.operatorProfile.buses.length > 0) {
    throwError("Cannot delete operator with assigned buses.", 400);
  }

  // Delete in transaction to maintain data integrity
  await prisma.$transaction(async (tx) => {
    // If user has an operator profile, delete it first
    if (user.operatorProfile) {
      await tx.operator.delete({ where: { id: user.operatorProfile.id } });
    }
    // Then delete the user
    await tx.user.delete({ where: { id } });
  });

  return { id: user.id, name: user.name, email: user.email };
};

export const addAdminService = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) throwError("Email already registered.", 409);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      role: "ADMIN",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

export const addOperatorService = async ({
  name,
  email,
  password,
  contactInfo,
  image,
}) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) throwError("Email already registered.", 409);

  const passwordHash = await bcrypt.hash(password, 10);

  let uploadedImage = null;

  try {
    if (image) {
      uploadedImage = await uploadImage(image);
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          role: "OPERATOR",
          imageUrl: uploadedImage?.image_url ?? null,
          imagePublicId: uploadedImage?.public_id ?? null,
        },
      });

      const operator = await tx.operator.create({
        data: {
          name,
          contactInfo: contactInfo ?? null,
          userId: user.id,
          logoUrl: uploadedImage?.image_url ?? null,
          imagePublicId: uploadedImage?.public_id ?? null,
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      return operator;
    });

    return result;
  } catch (err) {
    console.error("Error in addOperatorService:", err);
    if (uploadedImage?.public_id) {
      await cloudinary.uploader.destroy(uploadedImage.public_id);
    }
    // Re-throw the error with more context
    if (err.statusCode) {
      throw err;
    }
    const error = new Error(err.message || "Failed to create operator");
    error.statusCode = 500;
    throw error;
  }
};

export const deleteOperatorService = async (operatorId) => {
  const id = Number(operatorId);

  const operator = await prisma.operator.findUnique({
    where: { id },
    include: { user: true, buses: true },
  });

  if (!operator) throwError("Operator not found.", 404);
  if (operator.user.role !== "OPERATOR")
    throwError("User is not an operator.", 400);
  if (operator.buses.length > 0)
    throwError("Cannot delete operator with assigned buses.", 400);

  await prisma.$transaction(async (tx) => {
    await tx.operator.delete({ where: { id } });
    await tx.user.delete({ where: { id: operator.userId } });
  });

  if (operator.imagePublicId) {
    await cloudinary.uploader.destroy(operator.imagePublicId);
  }

  return { id: operator.id, name: operator.name };
};


export const uploadOperatorLogoService = async (operatorId, image) => {
  const operator = await prisma.operator.findUnique({
    where: { id: Number(operatorId) },
  });
  if (!operator) {
    throwError("Operator not found.", 404);
  }
  const uploaded = await uploadImage(image);
  if (operator.imagePublicId) {
    await cloudinary.uploader.destroy(operator.imagePublicId);
  }
  const updatedOperator = await prisma.operator.update({
    where: { id: Number(operatorId) },
    data: { logoUrl: uploaded.image_url, imagePublicId: uploaded.public_id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  return updatedOperator;
};

const ALLOWED_TRANSITIONS = {
  USER: ["OPERATOR"],
  OPERATOR: ["USER", "ADMIN"],
  ADMIN: ["OPERATOR"],
};

export const changeUserRoleService = async (userId, newRole, adminId) => {
  if (!ROLES.includes(newRole)) throwError("Invalid role.", 400);
  if (Number(userId) === Number(adminId))
    throwError("Cannot change your own role.", 400);

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
  });

  if (!user) throwError("User not found.", 404);

  const allowed = ALLOWED_TRANSITIONS[user.role];
  if (!allowed.includes(newRole))
    throwError(
      `Invalid role transition. ${user.role} can only be changed to: ${allowed.join(
        ", ",
      )}`,
      400,
    );

  if (user.role === "ADMIN" && newRole !== "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });
    if (adminCount <= 1)
      throwError("Cannot remove the last ADMIN from the system.", 400);
  }

  await prisma.$transaction(async (tx) => {
    if (
      (user.role === "USER" || user.role === "ADMIN") &&
      newRole === "OPERATOR"
    ) {
      const existingOperator = await tx.operator.findUnique({
        where: { userId: user.id },
      });

      if (!existingOperator) {
        await tx.operator.create({
          data: { name: user.name, userId: user.id },
        });
      }
    }

    if (
      user.role === "OPERATOR" &&
      (newRole === "USER" || newRole === "ADMIN")
    ) {
      await tx.operator.delete({
        where: { userId: user.id },
      });
    }

    await tx.user.update({
      where: { id: user.id },
      data: { role: newRole },
    });
  });

  return prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
};
