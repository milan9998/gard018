"use client";

import Link from "next/link";
import { ArrowRight, Loader2, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import { NewsCard, type NewsItem } from "@/components/news-card";

export function NewsPreview() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news?limit=3", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { news: [] }))
      .then((data) => setNews(data.news || []))
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && news.length === 0) return null;

  return (
    <section id="vesti" className="border-y border-primary/15 bg-black/10 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Newspaper className="h-4 w-4" /> Najnovije iz kluba
            </div>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Vesti i obaveštenja</h2>
          </div>
          <Link href="/vesti" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
            Sve vesti <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Učitavanje vesti...</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => <NewsCard key={item.id} news={item} />)}
          </div>
        )}
      </div>
    </section>
  );
}
