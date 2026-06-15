export const EXPECTED_COLUMNS = [
  "PMID",
  "Title",
  "Authors",
  "Citation",
  "First Author",
  "Journal/Book",
  "Publication Year",
  "Create Date",
  "PMCID",
  "NIHMS ID",
  "DOI",
] as const;

export type ParsedArticleRow = {
  rowNumber: number;
  pmid: string | null;
  title: string | null;
  authors: string | null;
  citation: string | null;
  firstAuthor: string | null;
  journal: string | null;
  year: number | null;
  createDate: string | null;
  pmcid: string | null;
  nihmsId: string | null;
  doi: string | null;
  dedupHash: string;
  warnings: string[];
  errors: string[];
};

export type ImportPreviewResult = {
  valid: ParsedArticleRow[];
  warnings: ParsedArticleRow[];
  errors: ParsedArticleRow[];
  duplicates: ParsedArticleRow[];
};

function cellToString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const str = value.trim();
    return str.length > 0 ? str : null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    const str = String(value).trim();
    return str.length > 0 ? str : null;
  }
  return null;
}

function parseYear(value: unknown): number | null {
  const str = cellToString(value);
  if (!str) return null;
  const year = parseInt(str, 10);
  return Number.isNaN(year) ? null : year;
}

function normalizeDoi(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/^doi:\s*/i, "").trim() || null;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

const HEADER_MAP: Record<string, keyof Omit<ParsedArticleRow, "rowNumber" | "dedupHash" | "warnings" | "errors">> = {
  pmid: "pmid",
  title: "title",
  authors: "authors",
  citation: "citation",
  "first author": "firstAuthor",
  "journal/book": "journal",
  "publication year": "year",
  "create date": "createDate",
  pmcid: "pmcid",
  "nihms id": "nihmsId",
  doi: "doi",
};

function validateRow(
  row: Omit<ParsedArticleRow, "warnings" | "errors">,
): { warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!row.title && !row.pmid) {
    errors.push("Missing both Title and PMID — cannot identify article");
  } else if (!row.title) {
    warnings.push("Missing Title");
  } else if (!row.pmid) {
    warnings.push("Missing PMID");
  }

  if (!row.doi) {
    warnings.push("Missing DOI");
  }

  if (!row.year) {
    warnings.push("Missing or invalid Publication Year");
  } else if (row.year > new Date().getFullYear() + 1) {
    warnings.push(`Publication Year ${row.year} is in the future`);
  }

  if (!row.authors) {
    warnings.push("Missing Authors");
  } else if (!row.authors.includes(";") && !row.authors.includes(",")) {
    warnings.push("Authors field may be malformed (expected ; or , separator)");
  }

  return { warnings, errors };
}

export function mapHeaders(headers: string[]): Map<number, string> {
  const mapping = new Map<number, string>();
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    const field = HEADER_MAP[normalized];
    if (field) {
      mapping.set(index, field);
    }
  });
  return mapping;
}

export function parseRowFromCells(
  rowNumber: number,
  cells: unknown[],
  columnMap: Map<number, string>,
  computeDedupHash: (pmid: string | null, doi: string | null) => string,
): ParsedArticleRow {
  const raw: Record<string, unknown> = {
    pmid: null,
    title: null,
    authors: null,
    citation: null,
    firstAuthor: null,
    journal: null,
    year: null,
    createDate: null,
    pmcid: null,
    nihmsId: null,
    doi: null,
  };

  columnMap.forEach((field, colIndex) => {
    const value = cells[colIndex];
    if (field === "year") {
      raw.year = parseYear(value);
    } else if (field === "doi") {
      raw.doi = normalizeDoi(cellToString(value));
    } else {
      raw[field] = cellToString(value);
    }
  });

  const dedupHash = computeDedupHash(
    raw.pmid as string | null,
    raw.doi as string | null,
  );

  const base = {
    rowNumber,
    pmid: raw.pmid as string | null,
    title: raw.title as string | null,
    authors: raw.authors as string | null,
    citation: raw.citation as string | null,
    firstAuthor: raw.firstAuthor as string | null,
    journal: raw.journal as string | null,
    year: raw.year as number | null,
    createDate: raw.createDate as string | null,
    pmcid: raw.pmcid as string | null,
    nihmsId: raw.nihmsId as string | null,
    doi: raw.doi as string | null,
    dedupHash,
  };

  const { warnings, errors } = validateRow(base);

  return { ...base, warnings, errors };
}

export function categorizeRows(
  rows: ParsedArticleRow[],
  existingHashes: Set<string>,
): ImportPreviewResult {
  const valid: ParsedArticleRow[] = [];
  const warnings: ParsedArticleRow[] = [];
  const errors: ParsedArticleRow[] = [];
  const duplicates: ParsedArticleRow[] = [];

  for (const row of rows) {
    if (row.errors.length > 0) {
      errors.push(row);
    } else if (existingHashes.has(row.dedupHash)) {
      duplicates.push(row);
    } else if (row.warnings.length > 0) {
      warnings.push(row);
      existingHashes.add(row.dedupHash);
    } else {
      valid.push(row);
      existingHashes.add(row.dedupHash);
    }
  }

  return { valid, warnings, errors, duplicates };
}

export async function parseExcelBuffer(
  buffer: Buffer,
  computeDedupHash: (pmid: string | null, doi: string | null) => string,
  existingHashes: Set<string>,
): Promise<ImportPreviewResult> {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  type ExcelLoadInput = Parameters<typeof workbook.xlsx.load>[0];
  await workbook.xlsx.load(
    Buffer.from(buffer) as unknown as ExcelLoadInput,
  );

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("Excel file contains no worksheets");
  }

  const rows: ParsedArticleRow[] = [];
  let columnMap: Map<number, string> | null = null;

  worksheet.eachRow((row, rowNumber) => {
    const cells = Array.isArray(row.values)
      ? row.values.slice(1)
      : [];

    if (rowNumber === 1) {
      columnMap = mapHeaders(
        cells.map((c) => cellToString(c) ?? ""),
      );
      return;
    }

    if (!columnMap || cells.every((c) => !cellToString(c))) {
      return;
    }

    rows.push(
      parseRowFromCells(rowNumber, cells, columnMap, computeDedupHash),
    );
  });

  return categorizeRows(rows, new Set(existingHashes));
}
