"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import * as React from "react";
import { Badge, Button } from "@/src/components/ui";
import type { Column } from "@/src/components/admin/data-table";
import { CrudListPage, RowActions } from "@/src/components/admin/crud-list-page";
import { CategoryFormDialog } from "@/src/components/admin/forms/catalog-forms";
import {
  useCreateMutation,
  useDeleteMutation,
  useUpdateMutation,
} from "@/src/hooks/use-admin-mutation";
import { useAdminList } from "@/src/hooks/use-admin-list";
import { categoryService } from "@/src/lib/services";
import type { Category, CategoryInput } from "@/src/types";

const DEFAULTS = { sort: "name", direction: "asc" as const };

export default function CategoriesPage() {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);

  const list = useAdminList<Category>({
    queryKeyPrefix: "categories",
    defaults: DEFAULTS,
    fetchPage: categoryService.list,
  });

  // Product counts are derived from the mock products, as required.
  const { data: counts } = useQuery({
    queryKey: ["categories", "counts"],
    queryFn: categoryService.counts,
  });

  const createCategory = useCreateMutation<CategoryInput, Category>({
    queryKey: "categories",
    entityLabel: "Category",
    successMessage: (category) => `${category.name} created`,
    mutationFn: categoryService.create,
    onSuccess: () => setFormOpen(false),
  });

  const updateCategory = useUpdateMutation<CategoryInput & { id: string }, Category>({
    queryKey: "categories",
    entityLabel: "Category",
    successMessage: (category) => `${category.name} updated`,
    mutationFn: ({ id, ...input }) => categoryService.update(id, input),
    onSuccess: () => {
      setFormOpen(false);
      setEditing(null);
    },
  });

  const deleteCategory = useDeleteMutation<Category>({
    queryKey: "categories",
    entityLabel: "Category",
    mutationFn: categoryService.remove,
  });

  const buildColumns = React.useCallback(
    (requestDelete: (item: Category) => void): Column<Category>[] => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (category) => (
          <div className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{category.name}</span>
            <span className="mt-0.5 block font-mono text-[11px] text-muted">{category.slug}</span>
          </div>
        ),
      },
      {
        key: "products",
        header: "Products",
        className: "text-right",
        render: (category) => {
          const count = counts?.[category.id] ?? 0;
          return <Badge tone={count > 0 ? "info" : "neutral"}>{count}</Badge>;
        },
      },
      {
        key: "actions",
        header: "Actions",
        className: "text-right",
        render: (category) => (
          <RowActions
            label={category.name}
            onEdit={() => {
              setEditing(category);
              setFormOpen(true);
            }}
            onDelete={() => requestDelete(category)}
          />
        ),
      },
    ],
    [counts],
  );

  const submit = async (input: CategoryInput) => {
    if (editing) await updateCategory.mutateAsync({ id: editing.id, ...input });
    else await createCategory.mutateAsync(input);
  };

  return (
    <CrudListPage
      eyebrow="Catalog"
      title="Categories"
      description="Categories group products. A category still referenced by a product cannot be deleted."
      itemLabel="categories"
      buildColumns={buildColumns}
      list={list}
      getRowId={(category) => category.id}
      deleteMutation={deleteCategory}
      deleteTitle={(category) => `Delete ${category.name}?`}
      searchPlaceholder="Search categories"
      addAction={
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-3.5" />
          New category
        </Button>
      }
      formDialog={
        <CategoryFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          category={editing}
          onSubmit={submit}
        />
      }
    />
  );
}
