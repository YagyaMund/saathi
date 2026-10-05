"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Floor" },
  { href: "/search", label: "Search" },
  { href: "/assistant", label: "Associate" },
  { href: "/insights", label: "Insights" },
];

function NavLinks({ onNavigate, large }: { onNavigate?: () => void; large?: boolean }) {
  const pathname = usePathname();
  return (
    <>
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const className = active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground";
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`${large ? "text-lg" : "text-sm"} ${className}`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-border/80 bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-heading text-2xl tracking-tight">
          Cove Supply
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <NavLinks />
        </nav>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle className="font-heading text-2xl">Cove Supply</SheetTitle>
              <SheetDescription>Coast and trail, edited down.</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-4 px-4">
              <NavLinks large onNavigate={() => setOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
