-- CreateTable
CREATE TABLE "stock_imports" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "note" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_import_items" (
    "id" TEXT NOT NULL,
    "stock_import_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(12,2),

    CONSTRAINT "stock_import_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_imports_code_key" ON "stock_imports"("code");

-- CreateIndex
CREATE INDEX "stock_imports_created_at_idx" ON "stock_imports"("created_at");

-- CreateIndex
CREATE INDEX "stock_import_items_stock_import_id_idx" ON "stock_import_items"("stock_import_id");

-- CreateIndex
CREATE INDEX "stock_import_items_variant_id_idx" ON "stock_import_items"("variant_id");

-- AddForeignKey
ALTER TABLE "stock_imports" ADD CONSTRAINT "stock_imports_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_import_items" ADD CONSTRAINT "stock_import_items_stock_import_id_fkey" FOREIGN KEY ("stock_import_id") REFERENCES "stock_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_import_items" ADD CONSTRAINT "stock_import_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
