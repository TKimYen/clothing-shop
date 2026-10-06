"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Label, RoleBadge, Select } from "@/src/components/ui";
import { ConfirmDialog } from "@/src/components/admin/confirm-dialog";
import { errorMessage, userService } from "@/src/lib/services";
import { formatRole } from "@/src/lib/utils";
import type { Role } from "@/src/types";

const ROLES: readonly Role[] = ["ADMIN", "CUSTOMER"];

/**
 * Role change for the user list and detail.
 *
 * The select holds a *draft* value that only becomes real after the confirm
 * dialog is accepted, so cancelling genuinely leaves the role untouched and the
 * select never displays a role the user has not committed to.
 */
export function RoleSelect({
  userId,
  currentRole,
  withBadge = false,
  className,
}: {
  userId: string;
  currentRole: Role;
  withBadge?: boolean;
  className?: string;
}) {
  const queryClient = useQueryClient();

  const [draft, setDraft] = React.useState<Role>(currentRole);
  const [confirming, setConfirming] = React.useState(false);
  const [lastRole, setLastRole] = React.useState<Role>(currentRole);

  // Re-sync when the role changes underneath us (a successful save, or a
  // refetch). Adjusted during render, which avoids the extra pass an effect
  // would cost and never flashes a stale draft.
  if (currentRole !== lastRole) {
    setLastRole(currentRole);
    setDraft(currentRole);
    setConfirming(false);
  }

  const mutation = useMutation({
    mutationFn: (role: Role) => userService.updateRole(userId, role),
    onSuccess: (user) => {
      toast.success(`${user.fullName} is now ${user.role.toLowerCase()}`);
      queryClient.setQueryData(["users", "detail", userId], user);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setConfirming(false);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      setConfirming(false);
      // Put the select back in step with reality.
      setDraft(currentRole);
    },
  });

  const isDirty = draft !== currentRole;

  return (
    <div className={className}>
      {withBadge ? (
        <span className="field-label">Role</span>
      ) : (
        <Label htmlFor={`role-${userId}`} className="sr-only">
          Role
        </Label>
      )}

      <div className="flex items-center gap-2">
        <Select
          id={`role-${userId}`}
          aria-label="Role"
          value={draft}
          disabled={mutation.isPending || confirming}
          onChange={(event) => setDraft(event.target.value as Role)}
          className="h-8 w-auto min-w-32 text-xs"
        >
          {ROLES.map((role) => (
            <option
              key={role}
              value={role}
              // The current role is not a transition, so it is not selectable.
              // Same rule as the order status select.
              disabled={role === currentRole}
            >
              {formatRole(role)}
              {role === currentRole ? " (current)" : ""}
            </option>
          ))}
        </Select>

        {withBadge ? <RoleBadge role={currentRole} /> : null}

        <Button
          size="sm"
          loading={mutation.isPending}
          disabled={!isDirty || confirming}
          onClick={() => setConfirming(true)}
        >
          Save
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => setConfirming(open)}
        title="Change user role?"
        description={
          <>
            This user will become{" "}
            <span className="font-semibold text-ink">{formatRole(draft)}</span> instead of{" "}
            <span className="font-semibold text-ink">{formatRole(currentRole)}</span>.
          </>
        }
        confirmLabel="Change role"
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate(draft)}
      />
    </div>
  );
}