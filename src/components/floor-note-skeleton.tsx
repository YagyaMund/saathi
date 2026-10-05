import { Skeleton } from "@/components/ui/skeleton";

export function FloorNoteSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl bg-secondary/70 p-5" aria-live="polite">
      <p className="text-sm text-muted-foreground">Writing a floor note…</p>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}
