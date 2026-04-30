import type { SectionType, SectionBlock } from "./types";
import { normalizeLines } from "./normalize";

export function detectSectionTypeByHeader(line: string): SectionType | null {
  const t = line.trim().replace(/\s/g, "").toLowerCase();

  if (
    t.includes("混合題") ||
    t.includes("非選擇混合") ||
    t.includes("mixed")
  ) {
    return "mixed";
  }

  if (
    t.includes("多選題") ||
    t.includes("複選題") ||
    t.includes("multiplechoice")
  ) {
    return "mixed";
  }

  if (
    t.includes("單選題") ||
    t.includes("單題") ||
    t.includes("詞彙") ||
    t.includes("字彙") ||
    t.includes("選擇題") ||
    t.includes("基礎題")
  ) {
    return "vocabulary";
  }

  if (
    t.includes("綜合測驗") ||
    t.includes("克漏字") ||
    t.includes("完形") ||
    t.includes("cloze")
  ) {
    return "cloze";
  }

  if (
    t.includes("文意選填") ||
    t.includes("選填") ||
    t.includes("共用選項")
  ) {
    return "shared_option_fill";
  }

  if (
    t.includes("篇章結構") ||
    t.includes("段落重組") ||
    t.includes("句子重組") ||
    t.includes("discourse")
  ) {
    return "discourse_structure";
  }

  if (
    t.includes("閱讀測驗") ||
    t.includes("閱讀理解") ||
    t.includes("reading") ||
    t.includes("題組")
  ) {
    return "reading";
  }

  if (
    t.includes("中譯英") ||
    t.includes("翻譯") ||
    t.includes("translation")
  ) {
    return "translation";
  }

  if (
    t.includes("作文") ||
    t.includes("寫作") ||
    t.includes("essay") ||
    t.includes("writing")
  ) {
    return "essay";
  }

  return null;
}

export function splitBySectionHeaders(text: string): SectionBlock[] {
  const lines = normalizeLines(text);
  const sections: SectionBlock[] = [];

  let currentType: SectionType = "unknown";
  let currentTitle = "";
  let buffer: string[] = [];

  function pushSection() {
    const content = buffer.join("\n").trim();
    if (!content) return;

    sections.push({
      sectionType: currentType,
      title: currentTitle,
      content,
    });
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const headerType = detectSectionTypeByHeader(line);

    if (headerType) {
      pushSection();
      currentType = headerType;
      currentTitle = line;
      buffer = [];
      continue;
    }

    buffer.push(rawLine);
  }

  pushSection();

  if (sections.length === 0) {
    sections.push({
      sectionType: "unknown",
      title: "",
      content: text.trim(),
    });
  }

  return sections;
}

export function detectSectionTypeByContent(text: string) {
  const lower = text.toLowerCase();
  const normalized = normalizeLines(text);

  const hasNumberedQuestions = /^\s*\d+\./m.test(text);
  const optionLines = normalized
    .map((line) => line.trim())
    .filter((line) => /^\(?[A-J][\)\.]/.test(line));

  const optionLabels = optionLines
    .map((line) => {
      const m = line.match(/^\(?([A-J])[\)\.]/);
      return m ? m[1].toUpperCase() : null;
    })
    .filter(Boolean) as string[];

  const uniqueOptionLabels = [...new Set(optionLabels)];
  const hasChoiceOptions = optionLabels.some((x) =>
    ["A", "B", "C", "D"].includes(x)
  );
  const hasOptionBeyondD = optionLabels.some(
    (x) => !["A", "B", "C", "D"].includes(x)
  );

  const hasWritingHints =
    lower.includes("作文") ||
    lower.includes("essay") ||
    lower.includes("中譯英") ||
    lower.includes("translate");

  const hasSharedOptionHints =
    lower.includes("文意選填") ||
    lower.includes("選填") ||
    hasOptionBeyondD ||
    uniqueOptionLabels.length > 4;

  if (hasWritingHints) return "non_choice";
  if (hasSharedOptionHints) return "shared_option_fill";
  if (hasNumberedQuestions && hasChoiceOptions) return "reading_or_choice";
  if (!hasNumberedQuestions && optionLines.length >= 4) return "reading_or_choice";

  return "non_choice";
}
