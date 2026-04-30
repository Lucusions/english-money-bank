import type { ParsedQuestion } from "../types";
import {
  normalizeLines,
  isBlank,
  normalizePassage,
  detectDifficulty,
} from "../normalize";
import {
  parseAnswerMap,
  parseOrderedAnswers,
  parseTextAnswerMap,
  getAnswerForQuestion,
  applyCorrectToOptions,
} from "../answers";
import { detectTags } from "../tags";
import { parseQuestionStart, parseGroupRange, parseChoiceOption } from "./choice";

export function parseMixedWithOptions(
  text: string,
  answers: string
): ParsedQuestion[] {
  const lines = normalizeLines(text);
  const answerMap = parseAnswerMap(answers || "");
  const orderedAnswers = parseOrderedAnswers(answers || "");
  const textAnswerMap = parseTextAnswerMap(answers || "");
  const questions: ParsedQuestion[] = [];

  let current: ParsedQuestion | null = null;
  let passageBuffer = "";
  let autoQuestionNo = 1;

  function pushCurrent() {
    if (!current) return;

    const orderIndex = questions.length;
    const ansChoice = getAnswerForQuestion(
      current.question_no,
      orderIndex,
      answerMap,
      orderedAnswers
    );
    const ansText = current.question_no
      ? textAnswerMap[current.question_no] || ""
      : "";

    if (current.options.length > 0) {
      current.options = applyCorrectToOptions(current.options, ansChoice);
      current.type = "multi_choice";
      current.question.type = "multi_choice";
      current.question.answer_text = Array.isArray(ansChoice)
        ? ansChoice.join("")
        : typeof ansChoice === "string"
        ? ansChoice
        : "";
    } else {
      current.type = "short_answer";
      current.question.type = "short_answer";
      current.question.answer_text =
        ansText ||
        (Array.isArray(ansChoice)
          ? ansChoice.join("")
          : typeof ansChoice === "string"
          ? ansChoice
          : "");
    }

    current.passage = normalizePassage(passageBuffer);
    current.question.difficulty = detectDifficulty(
      current.question.body,
      current.passage
    );
    current.tags = detectTags({
      body: current.question.body,
      passage: current.passage,
      type: current.type,
      sectionType: "mixed",
    });

    questions.push(current);
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (parseGroupRange(line.trim())) continue;

    const qStart = parseQuestionStart(line);

    if (qStart) {
      pushCurrent();

      current = {
        type: "short_answer",
        question_no: qStart.number,
        passage: normalizePassage(passageBuffer),
        group_title: "混合題組",
        group_type: "mixed_group",
        option_set: null,
        question: {
          body: qStart.body,
          type: "short_answer",
          difficulty: "medium",
          answer_text: "",
        },
        options: [],
        tags: [],
      };

      continue;
    }

    if (!current) {
      if (isBlank(line)) {
        if (passageBuffer.trim()) passageBuffer += "\n\n";
      } else {
        passageBuffer = passageBuffer ? passageBuffer + "\n" + line : line;
      }

      continue;
    }

    const opt = parseChoiceOption(line);

    if (opt) {
      current.options.push(opt);
      continue;
    }

    if (current.options.length === 0) {
      if (isBlank(line)) current.question.body += "\n\n";
      else current.question.body += "\n" + line;
    } else {
      const last = current.options[current.options.length - 1];
      if (isBlank(line)) last.text += "\n";
      else last.text += " " + line;
    }
  }

  pushCurrent();

  questions.forEach((q) => {
    if (!q.question_no) q.question_no = autoQuestionNo++;
  });

  return questions;
}
