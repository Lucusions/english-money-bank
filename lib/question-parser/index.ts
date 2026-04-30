import type { ParsedQuestion } from "./types";
import { normalizePDFText } from "./normalize";
import { splitBySectionHeaders, detectSectionTypeByContent } from "./sections";
import { parseSingleAndReading } from "./parsers/choice";
import { parseSharedOptionSection } from "./parsers/shared-option";
import { parseMixedWithOptions } from "./parsers/mixed";
import { parseNonChoice } from "./parsers/non-choice";

export function parseQuestionText(
  text: string,
  answers: string
): { data: ParsedQuestion[]; sectionCount: number } {
  const cleanedText = normalizePDFText(text);
  const sections = splitBySectionHeaders(cleanedText);
  const data: ParsedQuestion[] = [];

  for (const sec of sections) {
    if (sec.sectionType === "shared_option_fill") {
      data.push(
        ...parseSharedOptionSection(sec.content, answers, "shared_option_fill")
      );
      continue;
    }

    if (sec.sectionType === "discourse_structure") {
      data.push(
        ...parseSharedOptionSection(sec.content, answers, "discourse_structure")
      );
      continue;
    }

    if (
      sec.sectionType === "vocabulary" ||
      sec.sectionType === "cloze" ||
      sec.sectionType === "reading"
    ) {
      data.push(...parseSingleAndReading(sec.content, answers, sec.sectionType));
      continue;
    }

    if (sec.sectionType === "mixed") {
      data.push(...parseMixedWithOptions(sec.content, answers));
      continue;
    }

    if (sec.sectionType === "translation") {
      data.push(...parseNonChoice(sec.content, answers, "translation"));
      continue;
    }

    if (sec.sectionType === "essay") {
      data.push(...parseNonChoice(sec.content, answers, "essay"));
      continue;
    }

    const fallback = detectSectionTypeByContent(sec.content);

    if (fallback === "shared_option_fill") {
      data.push(
        ...parseSharedOptionSection(sec.content, answers, "shared_option_fill")
      );
    } else if (fallback === "reading_or_choice") {
      data.push(...parseSingleAndReading(sec.content, answers, sec.sectionType));
    } else {
      data.push(...parseNonChoice(sec.content, answers, sec.sectionType));
    }
  }

  return { data, sectionCount: sections.length };
}

export type { ParsedQuestion, ParsedTag, ParsedOption, SectionType, SectionBlock } from "./types";
