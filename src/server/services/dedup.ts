import { createHash } from "crypto";

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function computeDedupHash(
  pmid: string | null | undefined,
  doi: string | null | undefined,
): string {
  const payload = `${normalize(pmid)}|${normalize(doi)}`;
  return createHash("md5").update(payload).digest("hex");
}
