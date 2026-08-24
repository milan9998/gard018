"use client";

import Link from "next/link";
import { ArrowRight, Loader2, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import { NewsCard, type NewsItem } from "@/components/news-card";

export function NewsPreview() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 7000);

    fetch("/api/news?limit=3", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { news: [] }))
      .then((data) => setNews(data.news || []))
      .catch(() => setNews([]))
      .finally(() => {
        window.clearTimeout(timeoutId);
        setLoading(false);
      });

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return (
    <section id="vesti" className="premium-section motion-section border-y border-primary/15 bg-black/10 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Newspaper className="h-4 w-4" /> Najnovije iz kluba
            </div>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Vesti i obaveštenja</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Budi u toku sa dešavanjima, terminima i važnim informacijama iz GARD 018 kluba.
            </p>
          </div>
          <Link href="/vesti" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
            Sve vesti <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Učitavanje vesti...</div>
        ) : news.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => <NewsCard key={item.id} news={item} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-card/30 p-8 text-center">
            <p className="text-lg font-semibold text-foreground">Nove priče stižu uskoro.</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Prati najnovija obaveštenja, rezultate i dešavanja iz GARD 018 kluba.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
