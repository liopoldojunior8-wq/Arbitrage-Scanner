import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

export function signToken(password: string, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ pwd: password, iat: Date.now() })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const secret = process.env["SESSION_SECRET"] ?? "dev-secret";

  if (!token || !verifyToken(token, secret)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
