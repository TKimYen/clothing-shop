export default function ProductDetailLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Đang tải chi tiết sản phẩm"
      className="container mx-auto px-4 py-8"
    >
      <div className="h-5 w-36 animate-pulse rounded bg-gray-200" />

      <div className="mt-6 grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-2">
        <section>
          <div className="aspect-[4/5] animate-pulse rounded-xl bg-gray-100" />
          <div className="mt-4 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="aspect-square animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        </section>

        <section className="animate-pulse space-y-6 py-2">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-10 w-3/4 rounded bg-gray-200" />
          <div className="h-8 w-40 rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-gray-100" />
            <div className="h-4 w-11/12 rounded bg-gray-100" />
            <div className="h-4 w-2/3 rounded bg-gray-100" />
          </div>
          <div className="border-t border-gray-100 pt-6">
            <div className="h-5 w-24 rounded bg-gray-200" />
            <div className="mt-3 flex gap-3">
              <div className="h-10 w-24 rounded-lg bg-gray-100" />
              <div className="h-10 w-24 rounded-lg bg-gray-100" />
              <div className="h-10 w-24 rounded-lg bg-gray-100" />
            </div>
          </div>
          <div className="h-12 w-full rounded-lg bg-gray-200" />
        </section>
      </div>
    </main>
  );
}
