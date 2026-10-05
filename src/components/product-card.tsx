import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { money } from "@/lib/money";
import type { Product } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <Card className="h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:ring-foreground/20">
        <Image
          src={`/api/assets/${product.image}`}
          alt=""
          width={640}
          height={800}
          unoptimized
          className="aspect-[4/5] w-full bg-secondary object-cover"
        />
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="font-heading text-xl leading-tight">{product.name}</CardTitle>
            <p className="shrink-0 text-sm font-medium">{money(product.price)}</p>
          </div>
          <Badge variant="outline">{product.category}</Badge>
          <CardDescription className="pt-1 leading-6">{product.summary}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
