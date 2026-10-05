import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-start px-4 py-20">
      <p className="text-sm tracking-wide text-copper uppercase">Missing</p>
      <h1 className="mt-3 font-heading text-4xl">That piece is not on the floor.</h1>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        The catalog is twelve products. If a link went stale, start from the floor.
      </p>
      <Button render={<Link href="/" />} className="mt-6 h-10 px-4">
        Back to the floor
      </Button>
    </div>
  );
}
