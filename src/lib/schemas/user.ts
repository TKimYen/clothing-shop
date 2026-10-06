import { z } from "zod";
import type { Role } from "@/src/types";

export const roleSchema = z.enum(["ADMIN", "CUSTOMER"]);

export function roleUpdateSchema(currentRole: string) {
  return z.object({ role: roleSchema }).superRefine((values, ctx) => {
    if (values.role === (currentRole as Role)) {
      ctx.addIssue({
        code: "custom",
        path: ["role"],
        message: `Role is already ${currentRole}`,
      });
    }
  });
}

export type RoleFormValues = z.infer<typeof roleSchema>;
