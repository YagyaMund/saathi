import { AssistantPanel } from "@/components/assistant-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Associate",
  description: "A shopping associate grounded in the Cove Supply catalog.",
};

export default function AssistantPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm tracking-wide text-copper uppercase">Gemini on Vertex AI</p>
      <h1 className="mt-3 font-heading text-4xl sm:text-5xl">Ask the associate</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        The associate only knows the catalog. With a Google Cloud project set, answers come from
        Gemini. Without one, the same questions get a local reply that cites real pieces and prices.
      </p>
      <div className="mt-8">
        <AssistantPanel />
      </div>
    </div>
  );
}
