import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function verifyGoogleToken(token: string, clientId: string) {
  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error("Invalid Google token payload");
  }
  return {
    openId: `google_${payload.sub}`,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}
