import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://gard018.com"

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/settings/", "/test-email/", "/individualni-treninzi"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/settings/", "/test-email/", "/individualni-treninzi"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
