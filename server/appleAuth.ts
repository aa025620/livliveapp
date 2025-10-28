
import { Express, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

interface AppleAuthPayload {
  identityToken: string;
  user?: {
    email?: string;
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

interface AppleTokenPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  sub: string;
  email?: string;
  email_verified?: string;
}

export function setupAppleAuth(app: Express) {
  // Apple Sign-In callback endpoint
  app.post("/api/auth/apple", async (req, res) => {
    try {
      const { identityToken, user } = req.body as AppleAuthPayload;

      if (!identityToken) {
        return res.status(400).json({ error: "Identity token is required" });
      }

      // Decode the JWT token (without verification for now - you'll need to add verification in production)
      const decoded = jwt.decode(identityToken) as AppleTokenPayload;

      if (!decoded || !decoded.sub) {
        return res.status(400).json({ error: "Invalid identity token" });
      }

      // Create or update user in database
      const userId = `apple_${decoded.sub}`;
      const email = decoded.email || user?.email;
      const firstName = user?.name?.firstName;
      const lastName = user?.name?.lastName;

      await storage.upsertUser({
        id: userId,
        email: email || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        profileImageUrl: undefined,
      });

      // Create session for the user
      const sessionUser = await storage.getUser(userId);

      // Set up session
      req.login({ claims: { sub: userId } }, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to create session" });
        }
        res.json({ 
          success: true, 
          user: sessionUser 
        });
      });
    } catch (error) {
      console.error("Apple Sign-In error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });
}
