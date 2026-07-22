import jwt from "jsonwebtoken";
import { User } from "./auth.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { getEnv } from "../../config/env.js";

const generateToken = (userId) => {
  return jwt.sign({ id: userId.toString() }, getEnv().jwtSecret, { expiresIn: "1d" });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, "BAD_REQUEST", "Email already in use");
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password");
    }

    const token = generateToken(user._id);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
