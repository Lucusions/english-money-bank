import type { ParsedTag, ParsedQuestion, SectionType } from "./types";

export function uniqueTags(tags: ParsedTag[]) {
  return tags.filter(
    (tag, index, arr) =>
      arr.findIndex(
        (t) => t.name === tag.name && t.category === tag.category
      ) === index
  );
}

export function detectTags(input: {
  body: string;
  passage?: string;
  type: ParsedQuestion["type"];
  sectionType?: SectionType;
}) {
  const text = `${input.passage || ""}\n${input.body}`.toLowerCase();
  const tags: ParsedTag[] = [{ name: "會考", category: "source" }];

  if (input.sectionType === "vocabulary") {
    tags.push({ name: "vocabulary", category: "vocabulary" });
  }

  if (input.sectionType === "cloze") {
    tags.push({ name: "cloze", category: "grammar" });
  }

  if (input.sectionType === "discourse_structure") {
    tags.push({ name: "discourse structure", category: "reading" });
    tags.push({ name: "shared_option", category: "reading" });
  }

  if (input.type === "reading_choice" || input.sectionType === "reading") {
    tags.push({ name: "reading", category: "reading" });
  }

  if (input.type === "shared_option_fill") {
    tags.push({ name: "shared_option", category: "grammar" });
  }

  if (input.type === "translation" || input.sectionType === "translation") {
    tags.push({ name: "translation", category: "writing" });
  }

  if (input.type === "essay" || input.sectionType === "essay") {
    tags.push({ name: "essay", category: "writing" });
  }

  if (input.type === "multi_choice" || input.sectionType === "mixed") {
    tags.push({ name: "mixed", category: "mixed" });
  }

  if (
    text.includes("main idea") ||
    text.includes("according to") ||
    text.includes("what do we know") ||
    text.includes("which is true")
  ) {
    tags.push({ name: "main idea", category: "reading" });
  }

  if (
    text.includes("___") ||
    text.includes("______") ||
    text.includes("blank") ||
    text.includes("tense") ||
    text.includes("grammar")
  ) {
    tags.push({ name: "grammar", category: "grammar" });
  }

  if (
    text.includes("meaning") ||
    text.includes("closest in meaning") ||
    text.includes("word")
  ) {
    tags.push({ name: "vocabulary", category: "vocabulary" });
  }

  return uniqueTags(tags);
}
