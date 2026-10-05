import { Button } from "@/components/ui/button";

export function StateMessage({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/80 px-6 py-12 text-center">
      <h2 className="font-heading text-2xl text-foreground">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{body}</p>
      {action ? (
        <Button className="mt-6 h-10 px-4" onClick={action.onClick} type="button">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
