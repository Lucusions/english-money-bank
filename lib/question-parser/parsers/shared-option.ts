import type { ParsedQuestion, SectionType } from "../types";
import { normalizeLines, normalizePassage, detectDifficulty } from "../normalize";
import {
  parseAnswerMap,
  parseOrderedAnswers,
  getAnswerForQuestion,
} from "../answers";
import { detectTags } from "../tags";
import { parseQuestionStart, parseGroupRange, parseChoiceOption } from "./choice";

export function parseSharedOptionSection(
  text: string,
  answers: string,
  sectionType: SectionType
): ParsedQuestion[] {
  const lines = normalizeLines(text);
  const answerMap = parseAnswerMap(answers || "");
  const orderedAnswers = parseOrderedAnswers(answers || "");
  const questions: ParsedQuestion[] = [];

  const blankQuestions: { number: number | null; body: string }[] = [];
  const optionSetItems: { label?: string; text: string; sort_order: number }[] =
    [];

  let passageLines: string[] = [];
  let inOptionBank = false;
  let autoQuestionNo = 1;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) continue;
    if (parseGroupRange(line)) continue;

    const qStart = parseQuestionStart(line);
    if (qStart) {
      blankQuestions.push({
        number: qStart.number,
        body: qStart.body,
      });
      continue;
    }

    const opt = parseChoiceOption(line);
    if (opt) {
      inOptionBank = true;
      optionSetItems.push({
        label: opt.label,
        text: opt.text,
        sort_order: optionSetItems.length,
      });
      continue;
    }

    if (!inOptionBank) passageLines.push(line);
  }

  const passage = normalizePassage(passageLines.join("\n"));
  const groupTitle =
    sectionType === "discourse_structure" ? "篇章結構題組" : "共用選項題組";
  const optionSetTitle =
    sectionType === "discourse_structure" ? "篇章結構選項" : "共用選項";

  for (const q of blankQuestions) {
    const orderIndex = questions.length;
    const ans = getAnswerForQuestion(
      q.number,
      orderIndex,
      answerMap,
      orderedAnswers
    );

    questions.push({
      type: "shared_option_fill",
      question_no: q.number ?? autoQuestionNo++,
      passage,
      group_title: groupTitle,
      group_type: "shared_option_group",
      option_set: {
        title: optionSetTitle,
        instruction: passage || "",
        items: optionSetItems,
      },
      question: {
        body: q.body,
        type: "shared_option_fill",
        difficulty: detectDifficulty(q.body, passage),
        instruction: passage || "",
        answer_text: Array.isArray(ans)
          ? ans.join("")
          : typeof ans === "string"
          ? ans
          : "",
      },
      options: [],
      tags: detectTags({
        body: q.body,
        passage,
        type: "shared_option_fill",
        sectionType,
      }),
    });
  }

  return questions;
}
