import { successResponse } from "@/lib/api-response";

export async function POST() {
  const response = successResponse({ message: "Logged out" });
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
