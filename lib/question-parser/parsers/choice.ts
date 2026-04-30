import type { ParsedQuestion, ParsedOption, SectionType } from "../types";
import {
  normalizeLines,
  isBlank,
  normalizePassage,
  detectDifficulty,
} from "../normalize";
import {
  parseAnswerMap,
  parseOrderedAnswers,
  getAnswerForQuestion,
  applyCorrectToOptions,
} from "../answers";
import { detectSectionTypeByHeader } from "../sections";
import { detectTags } from "../tags";

export function parseQuestionStart(line: string) {
  const m = line.trim().match(/^(\d+)\.\s*(.*)$/);
  if (!m) return null;
  return { number: Number(m[1]), body: m[2].trim() };
}

export function parseGroupRange(line: string) {
  const m = line
    .trim()
    .match(/^(?:第)?(\d+)\s*(?:至|-|－|~|～)\s*(\d+)題|^\((\d+)\s*-\s*(\d+)\)$/);

  if (!m) return null;

  return {
    start: Number(m[1] || m[3]),
    end: Number(m[2] || m[4]),
  };
}

export function parseChoiceOption(line: string) {
  const cleaned = line.trim();
  const m = cleaned.match(/^\(?([A-J])[\)\.]\s*(.+)$/i);
  if (!m) return null;

  return {
    label: m[1].toUpperCase(),
    text: m[2].trim(),
    is_correct: false,
  };
}

export function parseUnnumberedChoiceQuestions(
  text: string,
  answers: string,
  forcedSectionType: SectionType = "vocabulary"
): ParsedQuestion[] {
  const lines = normalizeLines(text);
  const answerMap = parseAnswerMap(answers || "");
  const orderedAnswers = parseOrderedAnswers(answers || "");
  const questions: ParsedQuestion[] = [];

  let currentBody = "";
  let currentOptions: ParsedOption[] = [];
  let autoQuestionNo = 1;

  function pushCurrent() {
    if (!currentBody.trim() || currentOptions.length < 2) return;

    const orderIndex = questions.length;
    const answer = getAnswerForQuestion(
      null,
      orderIndex,
      answerMap,
      orderedAnswers
    );

    questions.push({
      type: "single_choice",
      question_no: autoQuestionNo,
      passage: "",
      group_title: "",
      group_type: null,
      option_set: null,
      question: {
        body: normalizePassage(currentBody),
        type: "single_choice",
        difficulty: detectDifficulty(currentBody),
      },
      options: applyCorrectToOptions(currentOptions, answer),
      tags: detectTags({
        body: currentBody,
        type: "single_choice",
        sectionType: forcedSectionType,
      }),
    });

    autoQuestionNo++;
    currentBody = "";
    currentOptions = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (parseGroupRange(line)) continue;
    if (detectSectionTypeByHeader(line)) continue;
    if (line.startsWith("說明")) continue;

    const opt = parseChoiceOption(line);

    if (opt) {
      currentOptions.push(opt);
      continue;
    }

    if (currentOptions.length > 0) pushCurrent();

    currentBody = currentBody ? currentBody + "\n" + line : line;
  }

  pushCurrent();

  return questions;
}

export function parseSingleAndReading(
  text: string,
  answers: string,
  forcedSectionType: SectionType = "unknown"
): ParsedQuestion[] {
  const lines = normalizeLines(text);
  const answerMap = parseAnswerMap(answers || "");
  const orderedAnswers = parseOrderedAnswers(answers || "");
  const questions: ParsedQuestion[] = [];

  const hasNumberedQuestion = lines.some((line) => !!parseQuestionStart(line));
  const hasOptions = lines.some((line) => !!parseChoiceOption(line));

  if (
    !hasNumberedQuestion &&
    hasOptions &&
    forcedSectionType === "vocabulary"
  ) {
    return parseUnnumberedChoiceQuestions(text, answers, forcedSectionType);
  }

  let current: ParsedQuestion | null = null;
  let passageBuffer = "";

  function pushCurrent() {
    if (!current) return;
    if (current.options.length < 2) return;

    const orderIndex = questions.length;
    const ans = getAnswerForQuestion(
      current.question_no,
      orderIndex,
      answerMap,
      orderedAnswers
    );

    current.options = applyCorrectToOptions(current.options, ans);

    const hasPassage =
      forcedSectionType === "reading" || forcedSectionType === "cloze";

    current.type = hasPassage ? "reading_choice" : "single_choice";
    current.group_type = hasPassage ? "reading_group" : null;
    current.group_title =
      forcedSectionType === "cloze"
        ? "綜合測驗題組"
        : hasPassage
        ? "閱讀題組"
        : "";

    current.passage = hasPassage ? current.passage : "";
    current.question.type = hasPassage ? "reading_choice" : "single_choice";
    current.question.difficulty = detectDifficulty(
      current.question.body,
      current.passage
    );

    current.tags = detectTags({
      body: current.question.body,
      passage: current.passage,
      type: current.type,
      sectionType: forcedSectionType,
    });

    questions.push(current);
  }

  for (const line of lines) {
    if (parseGroupRange(line.trim())) continue;

    const qStart = parseQuestionStart(line);

    if (qStart) {
      pushCurrent();

      const shouldTreatAsReading =
        forcedSectionType === "reading" || forcedSectionType === "cloze";

      current = {
        type: shouldTreatAsReading ? "reading_choice" : "single_choice",
        question_no: qStart.number,
        passage: shouldTreatAsReading ? normalizePassage(passageBuffer) : "",
        group_title:
          forcedSectionType === "cloze"
            ? "綜合測驗題組"
            : shouldTreatAsReading
            ? "閱讀題組"
            : "",
        group_type: shouldTreatAsReading ? "reading_group" : null,
        option_set: null,
        question: {
          body: qStart.body,
          type: shouldTreatAsReading ? "reading_choice" : "single_choice",
          difficulty: "medium",
        },
        options: [],
        tags: [],
      };

      continue;
    }

    if (!current) {
      if (forcedSectionType === "vocabulary") continue;

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

  if (questions.length === 0 && hasOptions) {
    return parseUnnumberedChoiceQuestions(text, answers, forcedSectionType);
  }

  return questions;
}
