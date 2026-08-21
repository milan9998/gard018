import { Fragment, type ReactNode } from "react";

const URL_PATTERN = /https?:\/\/[^\s]+/g;
const TRAILING_PUNCTUATION = /[.,!?;:)\]]+$/;

function linkifyLine(line: string, lineIndex: number) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  URL_PATTERN.lastIndex = 0;
  while ((match = URL_PATTERN.exec(line)) !== null) {
    const rawUrl = match[0];
    const trailing = rawUrl.match(TRAILING_PUNCTUATION)?.[0] || "";
    const href = trailing ? rawUrl.slice(0, -trailing.length) : rawUrl;
    if (match.index > cursor) parts.push(line.slice(cursor, match.index));
    parts.push(
      <a
        key={`${lineIndex}-${match.index}`}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="break-all text-primary underline decoration-primary/60 underline-offset-2 hover:text-primary/80"
      >
        {href}
      </a>,
    );
    if (trailing) parts.push(trailing);
    cursor = match.index + rawUrl.length;
  }
  if (cursor < line.length) parts.push(line.slice(cursor));
  return parts;
}

export function NewsRichText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, index, lines) => (
        <Fragment key={index}>
          {linkifyLine(line, index)}
          {index < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}
