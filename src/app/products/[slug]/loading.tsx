export default function ProductDetailLoading() {
  return (
    <main className="container mx-auto grid grid-cols-1 gap-8 px-4 py-8 md:grid-cols-2">
      <div className="animate-pulse rounded-xl bg-gray-100 aspect-[4/5]" />
      <div className="animate-pulse space-y-4 py-4">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-10 w-3/4 rounded bg-gray-200" />
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-24 w-full rounded bg-gray-100" />
        <div className="h-12 w-full rounded bg-gray-200" />
      </div>
    </main>
  );
}
