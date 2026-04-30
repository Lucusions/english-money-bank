import type { ParsedOption } from "./types";

export function parseAnswerMap(answers: string) {
  const result: Record<number, string | string[]> = {};
  if (!answers || typeof answers !== "string") return result;

  const normalized = answers.replace(/\r/g, " ").replace(/\n/g, " ");
  const matches = normalized.matchAll(/(\d+)\s*[.:：]?\s*([A-Z]+)/gi);

  for (const m of matches) {
    const qno = Number(m[1]);
    const raw = m[2].toUpperCase();
    result[qno] = raw.length > 1 ? raw.split("") : raw;
  }

  return result;
}

export function parseOrderedAnswers(answers: string) {
  if (!answers || typeof answers !== "string") return [];

  const lines = answers
    .replace(/\r/g, "\n")
    .split(/\n|,|，|、|\s+/)
    .map((x) => x.trim())
    .filter(Boolean);

  const result: string[] = [];

  for (const item of lines) {
    const numbered = item.match(/^(\d+)\s*[.:：]?\s*([A-Z]+)$/i);
    if (numbered) {
      result.push(numbered[2].toUpperCase());
      continue;
    }

    const plain = item.match(/^[A-Z]+$/i);
    if (plain) result.push(item.toUpperCase());
  }

  return result;
}

export function parseTextAnswerMap(answers: string) {
  const result: Record<number, string> = {};
  if (!answers || typeof answers !== "string") return result;

  const lines = answers
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  for (const line of lines) {
    const m = line.match(/^(\d+)\s*[.:：]?\s*(.*)$/);
    if (!m) continue;
    result[Number(m[1])] = m[2].trim();
  }

  return result;
}

export function getAnswerForQuestion(
  questionNo: number | null | undefined,
  orderIndex: number,
  answerMap: Record<number, string | string[]>,
  orderedAnswers: string[]
) {
  if (questionNo && answerMap[questionNo]) return answerMap[questionNo];

  const ordered = orderedAnswers[orderIndex];
  if (!ordered) return undefined;

  return ordered.length > 1 ? ordered.split("") : ordered;
}

export function applyCorrectToOptions(
  options: ParsedOption[],
  answer: string | string[] | undefined
) {
  return options.map((o) => ({
    ...o,
    is_correct: Array.isArray(answer)
      ? answer.includes(o.label || "")
      : answer === (o.label || ""),
  }));
}
