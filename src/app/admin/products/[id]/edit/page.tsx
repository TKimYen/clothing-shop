"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { Button, Card, CardBody } from "@/src/components/ui";
import { PageHeader } from "@/src/components/admin/layout";
import { ProductForm } from "@/src/components/admin/forms/product-form";
import { useUpdateMutation } from "@/src/hooks/use-admin-mutation";
import { productService } from "@/src/lib/services";
import type { Product, ProductInput, ProductOptions } from "@/src/types";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params.id;

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ["products", "detail", productId],
    queryFn: () => productService.get(productId),
  });

  const { data: options } = useQuery({
    queryKey: ["products", "options"],
    queryFn: productService.options,
  });

  const updateProduct = useUpdateMutation<ProductInput & { id: string }, Product>({
    queryKey: "products",
    entityLabel: "Product",
    successMessage: "Product updated",
    mutationFn: ({ id, ...input }) => productService.update(id, input),
    onSuccess: (saved) => {
      router.push(`/admin/products/${saved.id}`);
    },
  });

  // The header stays mounted through loading and error states, so navigating to
  // an edit page never reflows the shell.
  return (
    <>
      <PageHeader
        eyebrow="Products"
        title={product ? `Edit ${product.name}` : "Edit product"}
        back={{ label: "Product", href: `/admin/products/${productId}` }}
        description="Changes apply to the catalogue immediately — this is a mock backend."
      />

      {isLoading ? (
        <Card>
          <CardBody>
            <div className="h-[520px] animate-pulse rounded bg-canvas-line" />
          </CardBody>
        </Card>
      ) : isError ? (
        <Card>
          <CardBody className="py-16 text-center">
            <p className="text-sm text-danger">
              {error instanceof Error ? error.message : "Could not load this product."}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => router.push("/admin/products")}
            >
              Back to products
            </Button>
          </CardBody>
        </Card>
      ) : !product ? null : !options ? (
        <Card>
          <CardBody>
            <div className="h-[520px] animate-pulse rounded bg-canvas-line" />
          </CardBody>
        </Card>
      ) : (
        <ProductForm
          product={product}
          options={options as ProductOptions}
          onSubmit={async (input) => {
            await updateProduct.mutateAsync({ id: product.id, ...input });
          }}
          onCancel={() => router.push(`/admin/products/${product.id}`)}
        />
      )}
    </>
  );
}