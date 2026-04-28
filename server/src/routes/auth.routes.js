import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { authenticate } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/security.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { createToken, toPublicUser } from "../utils/auth.js";

const router = Router();
const ALLOWED_SIGNUP_ROLES = ["student", "manager"];

router.post(
  "/signup",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw new HttpError(400, "Name, email, and password are required.");
    }

    if (password.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters long.");
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new HttpError(409, "Email is already in use.");
    }

    const safeRole = ALLOWED_SIGNUP_ROLES.includes(role) ? role : "student";
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: safeRole,
    });

    const token = createToken(user._id.toString());

    res.status(201).json({
      token,
      user: toPublicUser(user),
    });
  })
);

router.post(
  "/login",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new HttpError(400, "Email and password are required.");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw new HttpError(401, "Invalid email or password.");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new HttpError(401, "Invalid email or password.");
    }

    const token = createToken(user._id.toString());

    res.json({
      token,
      user: toPublicUser(user),
    });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: toPublicUser(req.user) });
  })
);

router.patch(
  "/profile",
  authenticate,
  asyncHandler(async (req, res) => {
    const { name, email, currentPassword, newPassword } = req.body || {};

    if (
      name === undefined &&
      email === undefined &&
      newPassword === undefined
    ) {
      throw new HttpError(400, "At least one profile field is required.");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      throw new HttpError(404, "User not found.");
    }

    const wantsEmailChange =
      email !== undefined && email.toLowerCase().trim() !== user.email;
    const wantsPasswordChange = newPassword !== undefined && String(newPassword).trim().length > 0;

    if (wantsEmailChange || wantsPasswordChange) {
      if (!currentPassword) {
        throw new HttpError(400, "Current password is required to update email or password.");
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new HttpError(401, "Current password is incorrect.");
      }
    }

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2) {
        throw new HttpError(400, "Name must be at least 2 characters.");
      }
      user.name = trimmedName;
    }

    if (wantsEmailChange) {
      const normalizedEmail = String(email).toLowerCase().trim();
      const existingUser = await User.findOne({
        _id: { $ne: user._id },
        email: normalizedEmail,
      }).select("_id");
      if (existingUser) {
        throw new HttpError(409, "Email is already in use.");
      }
      user.email = normalizedEmail;
    }

    if (wantsPasswordChange) {
      const safePassword = String(newPassword).trim();
      if (safePassword.length < 8) {
        throw new HttpError(400, "New password must be at least 8 characters long.");
      }
      user.passwordHash = await bcrypt.hash(safePassword, 10);
    }

    await user.save();

    res.json({
      message: "Profile updated successfully.",
      user: toPublicUser(user),
    });
  })
);

export default router;
