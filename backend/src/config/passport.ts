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
          // User exists — update profile info without triggering pre-save password hook
          const updated = await User.findByIdAndUpdate(
            user._id,
            {
              $set: {
                name: profile.displayName,
                avatar: profile.photos?.[0]?.value || user.avatar,
                isEmailVerified: true,
                lastLoginAt: new Date(),
              },
            },
            { returnDocument: "after" }
          );
          return done(null, updated || user);
        }

        // Check if user exists with the same email
        const existingUser = await User.findOne({ email: profile.emails?.[0]?.value });

        if (existingUser) {
          // Link Google account to existing user without triggering pre-save hook
          const updated = await User.findByIdAndUpdate(
            existingUser._id,
            {
              $set: {
                googleId: profile.id,
                provider: "google",
                providerId: profile.id,
                avatar: profile.photos?.[0]?.value || existingUser.avatar,
                isEmailVerified: true,
                lastLoginAt: new Date(),
              },
            },
            { returnDocument: "after" }
          );
          return done(null, updated || existingUser);
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
