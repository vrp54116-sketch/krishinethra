import PageSkeleton from "@/components/layout/PageSkeleton";

export default function RootLoading() {
  return (
    <main className="min-h-screen px-4 pb-24 pt-5 md:pb-10">
      <PageSkeleton rows={3} />
    </main>
  );
}
