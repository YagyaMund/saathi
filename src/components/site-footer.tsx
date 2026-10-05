import { runtimeModes } from "@/lib/config";

export function SiteFooter() {
  const modes = runtimeModes();
  return (
    <footer className="mt-auto border-t border-border/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-end md:justify-between">
        <p>
          Cove Supply · Portland
          <span className="mt-1 block text-xs">
            A product-discovery demo for the Google AI Builder Cup. No checkout, no accounts.
          </span>
        </p>
        <p className="max-w-md text-xs leading-5">
          {modes.catalog} · {modes.search} · {modes.gemini} · {modes.assets} · {modes.insights}
        </p>
      </div>
    </footer>
  );
}
