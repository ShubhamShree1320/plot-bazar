import { NextRequest } from "next/server";
import { unauthorizedResponse, forbiddenResponse } from "./api-response";

export function requireAuth(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return { error: unauthorizedResponse(), userId: null, role: null };
  const role = req.headers.get("x-user-role") || "USER";
  return { error: null, userId, role };
}

export function requireAdmin(req: NextRequest) {
  const { error, userId, role } = requireAuth(req);
  if (error) return { error, userId: null };
  if (role !== "ADMIN") return { error: forbiddenResponse("Admin access required"), userId: null };
  return { error: null, userId };
}
