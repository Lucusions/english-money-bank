import type { ParsedQuestion, SectionType } from "../types";
import { normalizeLines, isBlank, detectDifficulty } from "../normalize";
import { parseTextAnswerMap, parseOrderedAnswers } from "../answers";
import { detectTags } from "../tags";
import { parseQuestionStart } from "./choice";

export function parseNonChoice(
  text: string,
  answers: string,
  forcedSectionType: SectionType = "unknown"
): ParsedQuestion[] {
  const lines = normalizeLines(text);
  const textAnswerMap = parseTextAnswerMap(answers || "");
  const orderedAnswers = parseOrderedAnswers(answers || "");
  const questions: ParsedQuestion[] = [];

  let current: ParsedQuestion | null = null;
  let autoQuestionNo = forcedSectionType === "translation" ? 51 : 1;

  function pushCurrent() {
    if (!current) return;

    const orderIndex = questions.length;
    const orderedAns = orderedAnswers[orderIndex];

    current.question.difficulty = detectDifficulty(current.question.body);
    current.tags = detectTags({
      body: current.question.body,
      type: current.type,
      sectionType: forcedSectionType,
    });

    if (current.question_no && textAnswerMap[current.question_no]) {
      current.question.answer_text = textAnswerMap[current.question_no];
    } else if (orderedAns) {
      current.question.answer_text = orderedAns;
    }

    questions.push(current);
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const qStart = parseQuestionStart(line);

    if (qStart) {
      pushCurrent();

      let type: ParsedQuestion["type"] = "short_answer";
      if (forcedSectionType === "translation") type = "translation";
      if (forcedSectionType === "essay") type = "essay";

      const displayNo =
        forcedSectionType === "translation" && qStart.number <= 2
          ? qStart.number + 50
          : qStart.number;

      current = {
        type,
        question_no: displayNo,
        passage: "",
        group_title: "",
        group_type: null,
        option_set: null,
        question: {
          body: qStart.body,
          type,
          difficulty: "medium",
          answer_text: "",
        },
        options: [],
        tags: [],
      };

      continue;
    }

    if (!current) {
      if (forcedSectionType === "essay" && line.trim()) {
        current = {
          type: "essay",
          question_no: 53,
          passage: "",
          group_title: "",
          group_type: null,
          option_set: null,
          question: {
            body: line.trim(),
            type: "essay",
            difficulty: "hard",
            answer_text: "",
          },
          options: [],
          tags: [],
        };
      }

      continue;
    }

    if (isBlank(line)) current.question.body += "\n\n";
    else current.question.body += "\n" + line;
  }

  pushCurrent();

  questions.forEach((q) => {
    if (!q.question_no) q.question_no = autoQuestionNo++;
  });

  return questions;
}
