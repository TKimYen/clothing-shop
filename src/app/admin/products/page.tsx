"use client";

import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { ActiveBadge, Badge, Button } from "@/src/components/ui";
import { DataTable, type Column } from "@/src/components/admin/data-table";
import { PageHeader } from "@/src/components/admin/layout";
import { ConfirmDialog } from "@/src/components/admin/confirm-dialog";
import { FilterChip, FilterSelect, ProductThumb } from "@/src/components/admin/primitives";
import { useDeleteMutation } from "@/src/hooks/use-admin-mutation";
import { useAdminList } from "@/src/hooks/use-admin-list";
import { categoryService, collectionService, productService } from "@/src/lib/services";
import { formatCurrency, formatDate, lowestStock, totalStock } from "@/src/lib/utils";
import type { Product } from "@/src/types";

const DEFAULTS = {
  sort: "createdAt",
  direction: "desc" as const,
  filterKeys: ["categoryId", "collectionId", "isActive"] as const,
};

export default function ProductsPage() {
  const [pendingDelete, setPendingDelete] = React.useState<Product | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories", "options"],
    // Reference data for the filter selects: a large page size, no search.
    queryFn: () => categoryService.list({ pageSize: 100, sort: "name" }),
  });
  const { data: collections } = useQuery({
    queryKey: ["collections", "options"],
    queryFn: () => collectionService.list({ pageSize: 100, sort: "name" }),
  });

  const list = useAdminList<Product>({
    queryKeyPrefix: "products",
    defaults: DEFAULTS,
    fetchPage: (params) => productService.list(params),
  });

  const removeProduct = useDeleteMutation<Product>({
    queryKey: "products",
    entityLabel: "Product",
    mutationFn: productService.remove,
  });

  const categoryName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of categories?.items ?? []) map.set(row.id, row.name);
    return map;
  }, [categories]);

  const collectionName = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const row of collections?.items ?? []) map.set(row.id, row.name);
    return map;
  }, [collections]);

  const columns = React.useMemo<Column<Product>[]>(
    () => [
      {
        key: "name",
        header: "Product",
        sortable: true,
        render: (product) => (
          <div className="flex items-center gap-3">
            <ProductThumb src={product.images[0]?.url} alt={product.name} />
            <div className="min-w-0">
              <Link
                href={`/admin/products/${product.id}`}
                className="block truncate text-sm font-semibold text-ink hover:text-brand"
              >
                {product.name}
              </Link>
              <p className="mt-0.5 truncate font-mono text-[11px] text-muted">{product.slug}</p>
            </div>
          </div>
        ),
      },
      {
        key: "categoryId",
        header: "Category",
        render: (product) => (
          <span className="text-sm">{categoryName.get(product.categoryId) ?? "—"}</span>
        ),
      },
      {
        key: "collectionId",
        header: "Collection",
        render: (product) => (
          <span className="text-sm">{collectionName.get(product.collectionId) ?? "—"}</span>
        ),
      },
      {
        key: "price",
        header: "Price",
        sortable: true,
        render: (product) => (
          <div className="leading-tight">
            <span className="block text-sm font-semibold text-ink">
              {formatCurrency(product.salePrice ?? product.price)}
            </span>
            {product.salePrice !== null ? (
              <span className="block text-[11px] text-muted line-through">
                {formatCurrency(product.price)}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: "stock",
        header: "Stock",
        sortable: true,
        render: (product) => {
          const stock = totalStock(product.variants);
          const low = lowestStock(product.variants);
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{stock}</span>
              {low < 10 ? <Badge tone="warning">low</Badge> : null}
            </div>
          );
        },
      },
      {
        key: "createdAt",
        header: "Created",
        sortable: true,
        render: (product) => (
          <span className="text-xs whitespace-nowrap text-muted">
            {formatDate(product.createdAt)}
          </span>
        ),
      },
      {
        key: "isActive",
        header: "Status",
        render: (product) => <ActiveBadge isActive={product.isActive} />,
      },
      {
        key: "actions",
        header: "Actions",
        className: "text-right",
        render: (product) => (
          <div className="flex justify-end gap-1">
            <Button asChild variant="ghost" size="icon" aria-label={`Edit ${product.name}`}>
              <Link href={`/admin/products/${product.id}/edit`}>
                <Pencil className="size-3.5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${product.name}`}
              onClick={() => setPendingDelete(product)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [categoryName, collectionName],
  );

  const { filters } = list.state;

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Price lives on the product. Variants carry size, colour, SKU and stock."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/products/new">
              <Plus className="size-3.5" />
              New product
            </Link>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={list.data?.items ?? []}
        getRowId={(product) => product.id}
        isLoading={list.isLoading}
        error={list.isError ? list.error : undefined}
        onRetry={() => void list.refetch()}
        total={list.data?.total ?? 0}
        page={list.data?.page ?? 1}
        pageSize={list.data?.pageSize ?? list.state.pageSize}
        onPageChange={list.goToPage}
        onPageSizeChange={list.setPageSize}
        itemLabel="products"
        searchValue={list.searchInput}
        onSearchChange={list.setSearch}
        isSearchPending={list.isSearchPending}
        searchPlaceholder="Search by name"
        searchLabel="Search products by name"
        sort={list.state.sort}
        direction={list.state.direction}
        onSortChange={list.setSort}
        emptyTitle="No products match"
        emptyDescription="Try clearing the search or filters."
        emptyAction={
          list.hasActiveFilters || list.searchInput ? (
            <Button variant="secondary" size="sm" onClick={list.resetAll}>
              Clear filters
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/admin/products/new">
                <Plus className="size-3.5" />
                Create the first product
              </Link>
            </Button>
          )
        }
        toolbar={
          <>
            <FilterSelect
              id="filter-category"
              label="Category"
              value={filters.categoryId ?? ""}
              placeholder="All categories"
              options={(categories?.items ?? []).map((row) => ({
                value: row.id,
                label: row.name,
              }))}
              onChange={(value) => list.setFilter("categoryId", value)}
            />
            <FilterSelect
              id="filter-collection"
              label="Collection"
              value={filters.collectionId ?? ""}
              placeholder="All collections"
              options={(collections?.items ?? []).map((row) => ({
                value: row.id,
                label: row.name,
              }))}
              onChange={(value) => list.setFilter("collectionId", value)}
            />
            <FilterSelect
              id="filter-active"
              label="Status"
              value={filters.isActive ?? ""}
              placeholder="Any status"
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Draft" },
              ]}
              onChange={(value) => list.setFilter("isActive", value)}
            />
          </>
        }
        meta={
          list.hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>Filters:</span>
              {filters.categoryId ? (
                <FilterChip
                  label={categoryName.get(filters.categoryId) ?? "Category"}
                  onClear={() => list.setFilter("categoryId", "")}
                />
              ) : null}
              {filters.collectionId ? (
                <FilterChip
                  label={collectionName.get(filters.collectionId) ?? "Collection"}
                  onClear={() => list.setFilter("collectionId", "")}
                />
              ) : null}
              {filters.isActive ? (
                <FilterChip
                  label={filters.isActive === "true" ? "Active" : "Draft"}
                  onClear={() => list.setFilter("isActive", "")}
                />
              ) : null}
              <Button variant="link" size="sm" onClick={list.clearFilters}>
                Clear all
              </Button>
            </div>
          ) : null
        }
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`Delete ${pendingDelete?.name ?? "product"}?`}
        description="This removes the product along with its variants and images. It cannot be undone."
        loading={removeProduct.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          removeProduct.mutate(pendingDelete.id, {
            onSettled: () => setPendingDelete(null),
          });
        }}
      />
    </>
  );
}
