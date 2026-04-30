export type ParsedTag = { name: string; category: string };

export type ParsedOption = {
  label?: string;
  text: string;
  is_correct: boolean;
};

export type ParsedQuestion = {
  type:
    | "single_choice"
    | "multi_choice"
    | "reading_choice"
    | "shared_option_fill"
    | "short_answer"
    | "translation"
    | "essay";
  question_no?: number | null;
  passage: string;
  group_title?: string;
  group_type?: "reading_group" | "shared_option_group" | "mixed_group" | null;
  option_set?: {
    title?: string;
    instruction?: string;
    items: { label?: string; text: string; sort_order: number }[];
  } | null;
  question: {
    body: string;
    type: string;
    difficulty: string;
    instruction?: string;
    answer_text?: string;
    meta_json?: Record<string, any>;
  };
  options: ParsedOption[];
  tags: ParsedTag[];
};

export type SectionType =
  | "vocabulary"
  | "cloze"
  | "shared_option_fill"
  | "discourse_structure"
  | "reading"
  | "mixed"
  | "translation"
  | "essay"
  | "unknown";

export type SectionBlock = {
  sectionType: SectionType;
  title: string;
  content: string;
};
