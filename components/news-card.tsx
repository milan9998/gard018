import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { NewsRichText } from "@/components/news-rich-text";

export type NewsItem = {
  id: number;
  title: string;
  image_url?: string;
  image_urls?: string[];
  description: string;
  content: string;
  published?: boolean;
  created_at: string;
  updated_at?: string;
};

export function formatNewsDate(value: string) {
  return new Date(value).toLocaleDateString("sr-RS", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function NewsCard({ news, full = false }: { news: NewsItem; full?: boolean }) {
  const imageUrls = news.image_urls?.length
    ? news.image_urls
    : news.image_url
      ? [news.image_url]
      : [];
  const visibleImages = full ? imageUrls : imageUrls.slice(0, 1);

  return (
    <article
      id={`vest-${news.id}`}
      className="scroll-mt-28 rounded-2xl border border-primary/20 bg-card/40 p-5 shadow-lg shadow-black/10 backdrop-blur-sm transition hover:border-primary/40 sm:p-6"
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        <CalendarDays className="h-4 w-4" />
        {formatNewsDate(news.created_at)}
      </div>
      <h2 className="mt-3 text-2xl font-bold text-foreground">{news.title}</h2>
      {visibleImages.length > 0 && (
        <div className="mt-5 space-y-4">
          {visibleImages.map((imageUrl, index) => (
            <img
              key={`${imageUrl}-${index}`}
              src={imageUrl}
              alt={index === 0 ? news.title : `${news.title} — slika ${index + 1}`}
              className="block h-auto w-full rounded-xl object-contain"
              loading={index === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>
      )}
      {news.description && (
        <p className={`mt-4 whitespace-normal leading-7 text-muted-foreground ${full ? "text-base" : "line-clamp-3"}`}>
          <NewsRichText text={news.description} />
        </p>
      )}
      {full && news.content && (
        <div className="mt-5 whitespace-normal leading-7 text-foreground/90">
          <NewsRichText text={news.content} />
        </div>
      )}
      {!full && (
        <Link
          href={`/vesti#vest-${news.id}`}
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80"
        >
          Pročitaj vest <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </article>
  );
}
