import { prisma } from "@/src/lib/db";
import { mapUser, userInclude } from "@/src/lib/admin/mappers";
import { adminHandler, badRequest, notFound, readJson } from "@/src/lib/admin/server";
import { roleInput } from "@/src/lib/admin/validators";

type Params = { id: string };

/** PATCH /api/admin/users/:id/role  body: { role } — the only editable user field. */
export const PATCH = adminHandler<Params>(async (request, { id }, admin) => {
  const { role } = await readJson(request, roleInput);
  const current = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!current) throw notFound("User not found");
  if (current.role === role) throw badRequest(`Role is already ${role}`);
  // Prevents an admin from locking themselves out of the admin area.
  if (admin && admin.id === id && role !== "ADMIN") {
    throw badRequest("You cannot remove your own admin role");
  }

  const row = await prisma.user.update({ where: { id }, data: { role }, include: userInclude });
  return mapUser(row);
});
