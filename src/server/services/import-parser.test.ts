import { describe, expect, it } from "vitest";

import { computeDedupHash } from "easySLR/server/services/dedup";
import {
  categorizeRows,
  parseRowFromCells,
  mapHeaders,
  type ParsedArticleRow,
} from "easySLR/server/services/import-parser";

describe("import-parser", () => {
  const columnMap = mapHeaders([
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
  ]);

  it("hard errors when both title and PMID are missing", () => {
    const row = parseRowFromCells(
      2,
      ["", "", "", "", "", "", "", "", "", "", ""],
      columnMap,
      computeDedupHash,
    );
    expect(row.errors).toContain("Missing both Title and PMID");
  });

  it("soft warns when DOI is missing", () => {
    const row = parseRowFromCells(
      2,
      ["12345", "Test Title", "Author A", "", "Author A", "Journal", "2020", "", "", "", ""],
      columnMap,
      computeDedupHash,
    );
    expect(row.errors).toHaveLength(0);
    expect(row.warnings).toContain("Missing DOI");
  });

  it("soft warns when year is missing", () => {
    const row = parseRowFromCells(
      2,
      ["12345", "Test Title", "Author A, Author B", "", "Author A", "Journal", "", "", "", "", "10.1/test"],
      columnMap,
      computeDedupHash,
    );
    expect(row.warnings).toContain("Missing Publication Year");
  });

  it("categorizes duplicates correctly", () => {
    const base: ParsedArticleRow = {
      rowNumber: 2,
      pmid: "123",
      title: "Title",
      authors: null,
      citation: null,
      firstAuthor: null,
      journal: null,
      year: 2020,
      createDate: null,
      pmcid: null,
      nihmsId: null,
      doi: "10.1/test",
      dedupHash: computeDedupHash("123", "10.1/test"),
      warnings: [],
      errors: [],
    };

    const existing = new Set([base.dedupHash]);
    const result = categorizeRows([base], existing);
    expect(result.duplicates).toHaveLength(1);
    expect(result.valid).toHaveLength(0);
  });
});

describe("dedup hash", () => {
  it("normalizes case and whitespace", () => {
    const a = computeDedupHash(" 123 ", "10.1/TEST");
    const b = computeDedupHash("123", "10.1/test");
    expect(a).toBe(b);
  });
});
