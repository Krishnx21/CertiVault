import { Router } from "express";
import { body } from "express-validator";
import { register, login } from "./auth.controller.js";
import { validate } from "../../middleware/validate.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register
);

authRouter.post(
  "/login",
  [
    body("email").trim().notEmpty().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);
