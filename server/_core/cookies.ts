import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(req: Request) {
  // Define isProd based on your environment
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    path: "/",
    // On localhost (dev), we MUST use "lax" and secure: false
    // On a real server (prod), we MUST use "none" and secure: true
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    secure: isProd,
  };
}