export interface ParseResult {
  validEmails: string[];
  totalDetected: number;
  duplicateCount: number;
  invalidCount: number;
  skippedCount: number;
}

// RFC 5322 compliant regex for standard email addresses
const EMAIL_REGEX = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/gi;

/**
 * Parses client-side text content from CSV or TXT lead files.
 * Extracts valid emails across all rows and columns, dedupes them,
 * and counts invalid or duplicate entries skipped.
 */
export function parseLeadFileContent(content: string): ParseResult {
  if (!content || !content.trim()) {
    return {
      validEmails: [],
      totalDetected: 0,
      duplicateCount: 0,
      invalidCount: 0,
      skippedCount: 0,
    };
  }

  // Split lines
  const lines = content.split(/\r?\n/);
  const seenEmails = new Set<string>();
  const validEmails: string[] = [];
  let duplicateCount = 0;
  let invalidCount = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Split cell by common delimiters (comma, semicolon, tab, pipe)
    const cells = trimmedLine.split(/[,;\t|]/);

    for (const cell of cells) {
      const cleanCell = cell.trim().replace(/^["']|["']$/g, "");
      if (!cleanCell) continue;

      // Skip common CSV header row terms
      const lowerCell = cleanCell.toLowerCase();
      if (
        lowerCell === "email" ||
        lowerCell === "emails" ||
        lowerCell === "email address" ||
        lowerCell === "recipient" ||
        lowerCell === "recipients" ||
        lowerCell === "name" ||
        lowerCell === "first name" ||
        lowerCell === "last name"
      ) {
        continue;
      }

      // Find any email matches in this cell
      const matches = cleanCell.match(EMAIL_REGEX);

      if (matches && matches.length > 0) {
        for (const match of matches) {
          const normalized = match.toLowerCase().trim();
          if (seenEmails.has(normalized)) {
            duplicateCount++;
          } else {
            seenEmails.add(normalized);
            validEmails.push(normalized);
          }
        }
      } else if (cleanCell.includes("@") || cleanCell.includes(".com") || cleanCell.includes(".org")) {
        // Looked like an email attempt but failed full validation
        invalidCount++;
      }
    }
  }

  return {
    validEmails,
    totalDetected: validEmails.length,
    duplicateCount,
    invalidCount,
    skippedCount: duplicateCount + invalidCount,
  };
}
