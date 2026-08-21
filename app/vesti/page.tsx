import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { NewsCard, type NewsItem } from "@/components/news-card";
import { sql } from "@/lib/db-singleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vesti | GARD 018",
  description: "Najnovije vesti, obaveštenja i dešavanja iz GARD 018 kluba.",
};

export default async function NewsPage() {
  let news: NewsItem[] = [];
  try {
    news = await sql`
      SELECT id, title, image_url, image_urls, description, content, published, created_at, updated_at
      FROM news
      WHERE published = TRUE
      ORDER BY created_at DESC, id DESC
    ` as NewsItem[];
  } catch (error) {
    console.error("[GARD018] Public news page fetch failed:", error);
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:pt-36">
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Newspaper className="h-4 w-4" /> GARD 018 vesti
          </div>
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Vesti i obaveštenja</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Pratite najnovija dešavanja, obaveštenja i rezultate iz našeg kluba.</p>
        </div>

        {news.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-card/40 p-10 text-center text-muted-foreground">Trenutno nema objavljenih vesti.</div>
        ) : (
          <div className="space-y-6">
            {news.map((item) => <NewsCard key={item.id} news={item} full />)}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
