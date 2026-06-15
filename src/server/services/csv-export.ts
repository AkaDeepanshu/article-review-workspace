import type { Article, ArticleReview } from "../../../generated/prisma";

type ArticleWithReview = Article & {
  reviews: ArticleReview[];
};

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function articlesToCsv(articles: ArticleWithReview[]): string {
  const headers = [
    "PMID",
    "Title",
    "Authors",
    "First Author",
    "Journal",
    "Year",
    "DOI",
    "Status",
    "Note",
  ];

  const rows = articles.map((article) => {
    const review = article.reviews[0];
    return [
      escapeCsv(article.pmid),
      escapeCsv(article.title),
      escapeCsv(article.authors),
      escapeCsv(article.firstAuthor),
      escapeCsv(article.journal),
      escapeCsv(article.year),
      escapeCsv(article.doi),
      escapeCsv(review?.status ?? "PENDING"),
      escapeCsv(review?.note),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
