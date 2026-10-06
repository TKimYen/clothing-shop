"use client";

import Link from "next/link";
import * as React from "react";
import { Button, RoleBadge } from "@/src/components/ui";
import type { Column } from "@/src/components/admin/data-table";
import { DataTable } from "@/src/components/admin/data-table";
import { PageHeader } from "@/src/components/admin/layout";
import { FilterChip, FilterSelect } from "@/src/components/admin/primitives";
import { useAdminList } from "@/src/hooks/use-admin-list";
import { userService } from "@/src/lib/services";
import type { Role, User } from "@/src/types";

const DEFAULTS = {
  sort: "fullName",
  direction: "asc" as const,
  filterKeys: ["role"] as const,
};

export default function UsersPage() {
  const list = useAdminList<User>({
    queryKeyPrefix: "users",
    defaults: DEFAULTS,
    fetchPage: userService.list,
  });

  const columns = React.useMemo<Column<User>[]>(
    () => [
      {
        key: "fullName",
        header: "Customer",
        sortable: true,
        render: (user) => (
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/12 text-[11px] font-bold text-brand"
            >
              {user.fullName.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <Link
                href={`/admin/users/${user.id}`}
                className="block truncate text-sm font-semibold text-ink hover:text-brand"
              >
                {user.fullName}
              </Link>
              <span className="mt-0.5 block truncate text-[11px] text-muted">{user.email}</span>
            </div>
          </div>
        ),
      },
      {
        key: "email",
        header: "Email",
        sortable: true,
        render: (user) => (
          <span className="font-mono text-xs text-muted">{user.email}</span>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        sortable: true,
        render: (user) => <span className="text-sm whitespace-nowrap">{user.phone}</span>,
      },
      {
        key: "addresses",
        header: "Addresses",
        className: "text-right",
        render: (user) => (
          <span className="text-sm text-muted">
            {user.addresses.length}
            {user.addresses.some((address) => address.isDefault) ? (
              <span className="ml-1 text-[11px] text-muted">(1 default)</span>
            ) : null}
          </span>
        ),
      },
      {
        key: "role",
        header: "Role",
        sortable: true,
        render: (user) => <RoleBadge role={user.role} />,
      },
    ],
    [],
  );

  const { filters } = list.state;

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Users"
        description="Customers and administrators. Role is the only editable field; addresses are read-only."
      />

      <DataTable
        columns={columns}
        data={list.data?.items ?? []}
        getRowId={(user) => user.id}
        isLoading={list.isLoading}
        error={list.isError ? list.error : undefined}
        onRetry={() => void list.refetch()}
        total={list.data?.total ?? 0}
        page={list.data?.page ?? 1}
        pageSize={list.data?.pageSize ?? list.state.pageSize}
        onPageChange={list.goToPage}
        onPageSizeChange={list.setPageSize}
        itemLabel="users"
        searchValue={list.searchInput}
        onSearchChange={list.setSearch}
        isSearchPending={list.isSearchPending}
        searchLabel="Search users"
        searchPlaceholder="Search name, email or phone"
        sort={list.state.sort}
        direction={list.state.direction}
        onSortChange={list.setSort}
        emptyTitle="No users match"
        emptyAction={
          list.hasActiveFilters || list.searchInput ? (
            <Button variant="secondary" size="sm" onClick={list.resetAll}>
              Clear filters
            </Button>
          ) : null
        }
        toolbar={
          <FilterSelect
            id="filter-role"
            label="Role"
            value={filters.role ?? ""}
            placeholder="Any role"
            options={[
              { value: "CUSTOMER", label: "Customer" },
              { value: "ADMIN", label: "Admin" },
            ]}
            onChange={(value) => list.setFilter("role", value as Role)}
          />
        }
        meta={
          list.hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>Filters:</span>
              {filters.role ? (
                <FilterChip
                  label={filters.role === "ADMIN" ? "Admin" : "Customer"}
                  onClear={() => list.setFilter("role", "")}
                />
              ) : null}
              <Button variant="link" size="sm" onClick={list.clearFilters}>
                Clear all
              </Button>
            </div>
          ) : null
        }
      />
    </>
  );
}