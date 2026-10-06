import { prisma } from "@/src/lib/db";
import { mapUser, userInclude } from "@/src/lib/admin/mappers";
import { adminHandler, notFound } from "@/src/lib/admin/server";

type Params = { id: string };

/** GET /api/admin/users/:id — addresses are returned read-only. */
export const GET = adminHandler<Params>(async (_request, { id }) => {
  const row = await prisma.user.findUnique({ where: { id }, include: userInclude });
  if (!row) throw notFound("User not found");
  return mapUser(row);
});
