import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createToken = (userId) =>
  jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const toPublicUser = (userDoc) => ({
  id: userDoc._id,
  name: userDoc.name,
  email: userDoc.email,
  role: userDoc.role,
  joinedClubs: userDoc.joinedClubs || [],
  createdAt: userDoc.createdAt,
});
