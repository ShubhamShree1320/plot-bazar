import { successResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    return successResponse({ user });
  } catch (err) {
    console.error("Me error:", err);
    return serverErrorResponse();
  }
}
