"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import * as React from "react";
import { Badge, Button } from "@/src/components/ui";
import type { Column } from "@/src/components/admin/data-table";
import { CrudListPage, RowActions } from "@/src/components/admin/crud-list-page";
import { SizeFormDialog } from "@/src/components/admin/forms/catalog-forms";
import {
  useCreateMutation,
  useDeleteMutation,
  useUpdateMutation,
} from "@/src/hooks/use-admin-mutation";
import { useAdminList } from "@/src/hooks/use-admin-list";
import { sizeService } from "@/src/lib/services";
import type { Size, SizeInput } from "@/src/types";

const DEFAULTS = { sort: "sortOrder", direction: "asc" as const };

export default function SizesPage() {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Size | null>(null);

  const list = useAdminList<Size>({
    queryKeyPrefix: "sizes",
    defaults: DEFAULTS,
    fetchPage: sizeService.list,
  });

  const { data: counts } = useQuery({
    queryKey: ["sizes", "counts"],
    queryFn: sizeService.counts,
  });

  const createSize = useCreateMutation<SizeInput, Size>({
    queryKey: "sizes",
    entityLabel: "Size",
    successMessage: (size) => `Size ${size.label} created`,
    mutationFn: sizeService.create,
    onSuccess: () => setFormOpen(false),
  });

  const updateSize = useUpdateMutation<SizeInput & { id: string }, Size>({
    queryKey: "sizes",
    entityLabel: "Size",
    successMessage: (size) => `Size ${size.label} updated`,
    mutationFn: ({ id, ...input }) => sizeService.update(id, input),
    onSuccess: () => {
      setFormOpen(false);
      setEditing(null);
    },
  });

  const deleteSize = useDeleteMutation<Size>({
    queryKey: "sizes",
    entityLabel: "Size",
    mutationFn: sizeService.remove,
  });

  const buildColumns = React.useCallback(
    (requestDelete: (item: Size) => void): Column<Size>[] => [
      {
        key: "label",
        header: "Label",
        sortable: true,
        render: (size) => <span className="font-display font-semibold text-ink">{size.label}</span>,
      },
      {
        key: "sortOrder",
        header: "Sort order",
        sortable: true,
        render: (size) => <span className="text-sm text-muted">{size.sortOrder}</span>,
      },
      {
        key: "products",
        header: "Used by",
        className: "text-right",
        render: (size) => {
          const count = counts?.[size.id] ?? 0;
          return <Badge tone={count > 0 ? "info" : "neutral"}>{count} products</Badge>;
        },
      },
      {
        key: "actions",
        header: "Actions",
        className: "text-right",
        render: (size) => (
          <RowActions
            label={size.label}
            onEdit={() => {
              setEditing(size);
              setFormOpen(true);
            }}
            onDelete={() => requestDelete(size)}
          />
        ),
      },
    ],
    [counts],
  );

  const submit = async (input: SizeInput) => {
    if (editing) await updateSize.mutateAsync({ id: editing.id, ...input });
    else await createSize.mutateAsync(input);
  };

  return (
    <CrudListPage
      eyebrow="Catalog"
      title="Sizes"
      description="Size options used by product variants. A size still used by a variant cannot be deleted."
      itemLabel="sizes"
      buildColumns={buildColumns}
      list={list}
      getRowId={(size) => size.id}
      deleteMutation={deleteSize}
      deleteTitle={(size) => `Delete size ${size.label}?`}
      searchPlaceholder="Search sizes"
      addAction={
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-3.5" />
          New size
        </Button>
      }
      formDialog={
        <SizeFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          size={editing}
          onSubmit={submit}
        />
      }
    />
  );
}
