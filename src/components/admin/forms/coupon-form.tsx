"use client";

import * as React from "react";
import { Badge, FormRow, Input, Select, Switch, Textarea } from "@/src/components/ui";
import {
  couponFormSchema,
  toCouponFormDefaultValues,
  toCouponInput,
} from "@/src/lib/schemas";
import type { Coupon, CouponInput } from "@/src/types";
import { FormDialog } from "./form-dialog";
import { useZodForm } from "./use-zod-form";

export function CouponFormDialog({
  open,
  onOpenChange,
  coupon,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
  onSubmit: (input: CouponInput) => Promise<void>;
}) {
  const defaults = React.useMemo(() => toCouponFormDefaultValues(coupon), [coupon]);
  const form = useZodForm(couponFormSchema, defaults);
  const discountType = form.watch("discountType");

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={coupon ? `Edit ${coupon.code}` : "New coupon"}
      description="Codes are stored uppercase. Usage is tracked by the checkout flow and cannot be edited here."
      form={form}
      defaultValues={defaults}
      submitLabel={coupon ? "Save changes" : "Create coupon"}
      onSubmit={async (values) => {
        await onSubmit(toCouponInput(values));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow name="code" label="Code" error={form.formState.errors.code?.message}>
          {(props) => (
            <Input
              {...props}
              value={form.watch("code")}
              onChange={(event) =>
                form.setValue("code", event.target.value.toUpperCase(), { shouldDirty: true })
              }
              placeholder="WELCOME10"
              className="font-mono uppercase"
              autoComplete="off"
            />
          )}
        </FormRow>

        <FormRow name="discountType" label="Discount type" error={form.formState.errors.discountType?.message}>
          {(props) => (
            <Select
              {...props}
              value={discountType}
              onChange={(event) =>
                form.setValue(
                  "discountType",
                  event.target.value as "PERCENT" | "FIXED",
                  { shouldDirty: true },
                )
              }
            >
              <option value="PERCENT">Percentage</option>
              <option value="FIXED">Fixed amount</option>
            </Select>
          )}
        </FormRow>

        <FormRow
          name="discountValue"
          label={discountType === "PERCENT" ? "Discount (%)" : "Discount ($)"}
          error={form.formState.errors.discountValue?.message}
        >
          {(props) => (
            <Input
              {...props}
              inputMode="decimal"
              value={form.watch("discountValue")}
              onChange={(event) =>
                form.setValue("discountValue", event.target.value, { shouldDirty: true })
              }
              placeholder={discountType === "PERCENT" ? "10" : "15"}
            />
          )}
        </FormRow>

        <FormRow
          name="minOrderAmount"
          label="Minimum order ($)"
          error={form.formState.errors.minOrderAmount?.message}
        >
          {(props) => (
            <Input
              {...props}
              inputMode="decimal"
              value={form.watch("minOrderAmount")}
              onChange={(event) =>
                form.setValue("minOrderAmount", event.target.value, { shouldDirty: true })
              }
              placeholder="50"
            />
          )}
        </FormRow>

        <FormRow
          name="maxDiscountAmount"
          label="Max discount ($)"
          error={form.formState.errors.maxDiscountAmount?.message}
          hint={<p className="mt-1 text-xs text-muted">Leave blank for no cap.</p>}
        >
          {(props) => (
            <Input
              {...props}
              inputMode="decimal"
              value={form.watch("maxDiscountAmount")}
              onChange={(event) =>
                form.setValue("maxDiscountAmount", event.target.value, { shouldDirty: true })
              }
              placeholder="40"
            />
          )}
        </FormRow>

        <FormRow
          name="maxUses"
          label="Maximum uses"
          description="Leave empty for unlimited"
          error={form.formState.errors.maxUses?.message}
        >
          {(props) => (
            <Input
              {...props}
              inputMode="numeric"
              value={form.watch("maxUses")}
              onChange={(event) =>
                form.setValue("maxUses", event.target.value, { shouldDirty: true })
              }
              placeholder="1000"
            />
          )}
        </FormRow>

        {/* Read-only: surfaced for context, never submitted onward. */}
        <div>
          <span className="field-label">Used count</span>
          <div className="flex h-9 items-center gap-2 rounded-md border border-line bg-canvas-soft px-3">
            <span className="text-sm text-muted">{form.watch("usedCount")}</span>
            <Badge tone="neutral">read-only</Badge>
          </div>
        </div>

        <FormRow name="startsAt" label="Starts at" error={form.formState.errors.startsAt?.message}>
          {(props) => (
            <Input
              {...props}
              type="datetime-local"
              value={form.watch("startsAt")}
              onChange={(event) =>
                form.setValue("startsAt", event.target.value, { shouldDirty: true })
              }
            />
          )}
        </FormRow>

        <FormRow name="endsAt" label="Ends at" error={form.formState.errors.endsAt?.message}>
          {(props) => (
            <Input
              {...props}
              type="datetime-local"
              value={form.watch("endsAt")}
              onChange={(event) =>
                form.setValue("endsAt", event.target.value, { shouldDirty: true })
              }
            />
          )}
        </FormRow>

        <div className="sm:col-span-2">
          <FormRow
            name="description"
            label="Description"
            error={form.formState.errors.description?.message}
          >
            {(props) => (
              <Textarea
                {...props}
                value={form.watch("description")}
                onChange={(event) =>
                  form.setValue("description", event.target.value, { shouldDirty: true })
                }
                placeholder="Who is this for, and what does it unlock?"
                className="min-h-20"
              />
            )}
          </FormRow>
        </div>

        <div className="sm:col-span-2">
          <Switch
            label="Active"
            description="Inactive coupons cannot be applied at checkout."
            checked={form.watch("isActive")}
            onChange={(event) => form.setValue("isActive", event.target.checked, { shouldDirty: true })}
          />
        </div>
      </div>
    </FormDialog>
  );
}
