import { auth, clerkClient } from "@clerk/nextjs/server";
import { apiError, apiSuccess } from "@/src/lib/api-response";
import { prisma } from "@/src/lib/db";

export async function POST() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return apiError("Unauthorized", 401);
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);

    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return apiError("Clerk user does not have an email", 400);
    }

    const fullName =
      `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
      "User";

    const user = await prisma.user.upsert({
      where: {
        clerkId,
      },
      create: {
        clerkId,
        email,
        fullName,
        passwordHash: "CLERK_MANAGED",
      },
      update: {
        email,
        fullName,
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
      },
    });

    return apiSuccess(user);
  } catch (error) {
    console.error("Failed to sync Clerk user:", error);
    return apiError("Unable to sync user", 500);
  }
}