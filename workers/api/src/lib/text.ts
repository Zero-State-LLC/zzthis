// FR-007: text is plain. The server removes control characters other than
// line feed, trims the title, and counts Unicode code points.

// General category Cc, except U+000A LINE FEED.
const CONTROL = /(?!\n)\p{Cc}/gu;

export const TITLE_MAX = 120;
export const BODY_MAX = 4000;
export const NOTE_MAX = 500;

export function withoutControls(text: string): string {
  return text.replace(CONTROL, "");
}

export function codePoints(text: string): number {
  return [...text].length;
}

export interface EverydayText {
  readonly title: string;
  readonly body: string;
}

// The cleaned title and body, or null when either is out of bounds. A title
// that is only whitespace is empty after the trim, so it is refused too.
export function cleanRecord(title: string, body: string): EverydayText | null {
  const cleanTitle = withoutControls(title).trim();
  const cleanBody = withoutControls(body);
  const titleLength = codePoints(cleanTitle);
  if (titleLength < 1 || titleLength > TITLE_MAX) return null;
  if (codePoints(cleanBody) > BODY_MAX) return null;
  return { title: cleanTitle, body: cleanBody };
}
