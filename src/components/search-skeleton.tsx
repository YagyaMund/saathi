import { Skeleton } from "@/components/ui/skeleton";

export function SearchSkeleton() {
  return (
    <div className="space-y-4" aria-live="polite">
      <p className="text-sm text-muted-foreground">Looking through the catalog…</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
