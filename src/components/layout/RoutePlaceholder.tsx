/** Minimal placeholder for app routes — real modules land in later milestones. */
export default function RoutePlaceholder({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        Full module coming in the next milestone.
      </p>
    </div>
  );
}
