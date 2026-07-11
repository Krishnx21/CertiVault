/**
 * Passport Configuration
 * Google OAuth 2.0 strategy setup
 */

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../modules/users/user.model.js";
import {
  generateTokenPair,
  hashRefreshToken,
  calculateTokenExpiration,
} from "../utils/jwt.js";
import { RefreshSession } from "../modules/auth/refreshSession.model.js";
import { getEnv } from "./env.js";

// Configure Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: getEnv().GOOGLE_CLIENT_ID || "",
      clientSecret: getEnv().GOOGLE_CLIENT_SECRET || "",
      callbackURL: getEnv().GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists - update profile info
          user.name = profile.displayName;
          user.avatar = profile.photos?.[0]?.value || user.avatar;
          user.isEmailVerified = true; // Google accounts are verified
          await user.save();
          return done(null, user);
        }

        // Check if user exists with the same email
        const existingUser = await User.findOne({ email: profile.emails?.[0]?.value });

        if (existingUser) {
          // Link Google account to existing user
          existingUser.googleId = profile.id;
          existingUser.provider = "google";
          existingUser.providerId = profile.id;
          existingUser.avatar = profile.photos?.[0]?.value || existingUser.avatar;
          existingUser.isEmailVerified = true;
          await existingUser.save();
          return done(null, existingUser);
        }

        // Create new user
        user = await User.create({
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          googleId: profile.id,
          provider: "google",
          providerId: profile.id,
          avatar: profile.photos?.[0]?.value,
          passwordHash: Math.random().toString(36), // Random password for OAuth users
          isEmailVerified: true,
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
