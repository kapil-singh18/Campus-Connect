import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";

export const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      throw new HttpError(401, "Authentication required.");
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select("-passwordHash");

    if (!user) {
      throw new HttpError(401, "Invalid authentication token.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      next(new HttpError(401, "Session expired. Please log in again."));
      return;
    }
    next(error);
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    next(new HttpError(401, "Authentication required."));
    return;
  }

  if (!roles.includes(req.user.role)) {
    next(new HttpError(403, "You do not have permission for this action."));
    return;
  }

  next();
};
