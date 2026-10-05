import { SearchPanel } from "@/components/search-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Cove Supply catalog with Vertex AI Search, or the local catalog.",
};

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const query = one((await searchParams).q);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm tracking-wide text-copper uppercase">Vertex AI Search</p>
      <h1 className="mt-3 font-heading text-4xl sm:text-5xl">Find a piece</h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        Product documents live in a Discovery Engine data store. This page calls that search when
        the project and data store are set, and matches the local catalog when they are not.
      </p>
      <div className="mt-8">
        <SearchPanel query={query} />
      </div>
    </div>
  );
}
