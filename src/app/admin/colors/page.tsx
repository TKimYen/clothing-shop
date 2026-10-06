"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import * as React from "react";
import { Badge, Button } from "@/src/components/ui";
import type { Column } from "@/src/components/admin/data-table";
import { CrudListPage, RowActions } from "@/src/components/admin/crud-list-page";
import { ColorFormDialog } from "@/src/components/admin/forms/catalog-forms";
import { ColorSwatch } from "@/src/components/admin/primitives";
import {
  useCreateMutation,
  useDeleteMutation,
  useUpdateMutation,
} from "@/src/hooks/use-admin-mutation";
import { useAdminList } from "@/src/hooks/use-admin-list";
import { colorService } from "@/src/lib/services";
import type { Color, ColorInput } from "@/src/types";

const DEFAULTS = { sort: "name", direction: "asc" as const };

export default function ColorsPage() {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Color | null>(null);

  const list = useAdminList<Color>({
    queryKeyPrefix: "colors",
    defaults: DEFAULTS,
    fetchPage: colorService.list,
  });

  const { data: counts } = useQuery({
    queryKey: ["colors", "counts"],
    queryFn: colorService.counts,
  });

  const createColor = useCreateMutation<ColorInput, Color>({
    queryKey: "colors",
    entityLabel: "Color",
    successMessage: (color) => `${color.name} created`,
    mutationFn: colorService.create,
    onSuccess: () => setFormOpen(false),
  });

  const updateColor = useUpdateMutation<ColorInput & { id: string }, Color>({
    queryKey: "colors",
    entityLabel: "Color",
    successMessage: (color) => `${color.name} updated`,
    mutationFn: ({ id, ...input }) => colorService.update(id, input),
    onSuccess: () => {
      setFormOpen(false);
      setEditing(null);
    },
  });

  const deleteColor = useDeleteMutation<Color>({
    queryKey: "colors",
    entityLabel: "Color",
    mutationFn: colorService.remove,
  });

  const buildColumns = React.useCallback(
    (requestDelete: (item: Color) => void): Column<Color>[] => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (color) => (
          <div className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{color.name}</span>
            <ColorSwatch hexCode={color.hexCode} size="sm" />
          </div>
        ),
      },
      {
        key: "hexCode",
        header: "Hex",
        sortable: true,
        render: (color) => (
          <span className="font-mono text-xs text-muted">{color.hexCode.toUpperCase()}</span>
        ),
      },
      {
        key: "products",
        header: "Used by",
        className: "text-right",
        render: (color) => {
          const count = counts?.[color.id] ?? 0;
          return <Badge tone={count > 0 ? "info" : "neutral"}>{count} products</Badge>;
        },
      },
      {
        key: "actions",
        header: "Actions",
        className: "text-right",
        render: (color) => (
          <RowActions
            label={color.name}
            onEdit={() => {
              setEditing(color);
              setFormOpen(true);
            }}
            onDelete={() => requestDelete(color)}
          />
        ),
      },
    ],
    [counts],
  );

  const submit = async (input: ColorInput) => {
    if (editing) await updateColor.mutateAsync({ id: editing.id, ...input });
    else await createColor.mutateAsync(input);
  };

  return (
    <CrudListPage
      eyebrow="Catalog"
      title="Colors"
      description="Color options used by variants and product images. A color still in use cannot be deleted."
      itemLabel="colors"
      buildColumns={buildColumns}
      list={list}
      getRowId={(color) => color.id}
      deleteMutation={deleteColor}
      deleteTitle={(color) => `Delete ${color.name}?`}
      searchPlaceholder="Search colors"
      addAction={
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-3.5" />
          New color
        </Button>
      }
      formDialog={
        <ColorFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          color={editing}
          onSubmit={submit}
        />
      }
    />
  );
}
