import prisma from "../../config/db.js";
import throwError from "../../utils/error.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUserService = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
    },
  });
  if (existingUser) {
    throwError("User already exist. Please login.", 409);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
};

export const loginUserService = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throwError("Email or password incorrect.", 400);
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throwError("Email or password incorrect.", 400);
  }

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
