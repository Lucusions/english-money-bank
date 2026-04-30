import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ImportTag = {
  name: string;
  category: string;
};

type ImportOption = {
  label?: string;
  text: string;
  is_correct: boolean;
};

type ImportOptionSet = {
  title?: string;
  instruction?: string;
  items: {
    label?: string;
    text: string;
    sort_order: number;
  }[];
} | null;

type ImportItem = {
  type:
    | "single"
    | "single_choice"
    | "multi_choice"
    | "reading_choice"
    | "shared_option_fill"
    | "short_answer"
    | "translation"
    | "essay";
  question_no?: number | null;
  passage?: string;
  group_title?: string;
  group_type?: "reading_group" | "shared_option_group" | "mixed_group" | null;
  option_set?: ImportOptionSet;
  question: {
    body: string;
    type?: string;
    difficulty?: string;
    instruction?: string;
    answer_text?: string;
    meta_json?: Record<string, any>;
  };
  options?: ImportOption[];
  tags?: ImportTag[];
};

function normalizeText(input: string | null | undefined) {
  return (input || "").trim();
}

function normalizeQuestionType(type: string | undefined | null) {
  if (!type) return "single_choice";
  if (type === "single") return "single_choice";
  return type;
}

function inferPaperTitle(items: ImportItem[]) {
  const sourceTag = items
    .flatMap((x) => x.tags || [])
    .find((t) => t.category === "source");

  if (sourceTag?.name) return `${sourceTag.name} 英文考卷`;

  return `匯入考卷 ${new Date().toISOString().slice(0, 10)}`;
}

function inferSectionType(item: ImportItem) {
  const type = normalizeQuestionType(item.question?.type || item.type);
  const tagNames = (item.tags || []).map((t) => t.name);

  if (type === "translation") return "translation";
  if (type === "essay") return "essay";
  if (type === "multi_choice" || tagNames.includes("mixed")) return "mixed";

  if (type === "shared_option_fill") return "shared_option";

  if (type === "reading_choice") {
    if (tagNames.includes("cloze")) return "cloze";
    return "reading";
  }

  if (type === "short_answer") return "mixed";

  if (type === "single_choice") {
    if (tagNames.includes("vocabulary")) return "vocabulary";
    return "vocabulary";
  }

  return "other";
}

function inferSectionTitle(sectionType: string) {
  const map: Record<string, string> = {
    vocabulary: "詞彙題",
    cloze: "綜合測驗",
    shared_option: "文意選填 / 篇章結構",
    reading: "閱讀測驗",
    mixed: "混合題",
    translation: "中譯英",
    essay: "英文作文",
    other: "其他題型",
  };

  return map[sectionType] || "其他題型";
}

function inferScore(item: ImportItem) {
  const type = normalizeQuestionType(item.question?.type || item.type);

  if (type === "essay") return 20;
  if (type === "translation") return 4;
  if (type === "multi_choice") return 4;
  if (type === "short_answer") return 2;
  if (type === "reading_choice") return 2;
  if (type === "shared_option_fill") return 1;

  return 1;
}

function serializeError(error: any) {
  return {
    message: error?.message || String(error),
    details: error?.details || null,
    hint: error?.hint || null,
    code: error?.code || null,
  };
}

export async function POST(req: Request) {
  const failures: any[] = [];

  try {
    const body = await req.json();

    let items: ImportItem[] = [];
    let paperTitle = "";
    let paperYear: number | null = null;
    let paperSource = "quick-import";
    let examType = "english";

    if (Array.isArray(body)) {
      items = body;
    } else {
      items = body.items || body.data || [];
      paperTitle = body.paperTitle || body.title || "";
      paperYear = body.year || null;
      paperSource = body.source || "quick-import";
      examType = body.examType || "english";
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "匯入資料格式錯誤或沒有題目" },
        { status: 400 }
      );
    }

    if (!paperTitle) paperTitle = inferPaperTitle(items);

    const { data: paper, error: paperError } = await supabase
      .from("papers")
      .insert({
        title: paperTitle,
        year: paperYear,
        source: paperSource,
        exam_type: examType,
        notes: "Created by quick-import",
      })
      .select()
      .single();

    if (paperError) throw paperError;

    const paperId = paper.id;

    const passageCache: Record<string, string> = {};
    const groupCache: Record<string, string> = {};
    const optionSetCache: Record<string, string> = {};
    const tagCache: Record<string, string> = {};
    const sectionCache: Record<string, string> = {};
    const sectionOrderMap: Record<string, number> = {};

    let globalSortOrder = 0;
    let insertedQuestions = 0;
    let reusedQuestions = 0;
    let insertedPaperItems = 0;

    async function getOrCreateSection(sectionType: string) {
      if (sectionCache[sectionType]) return sectionCache[sectionType];

      const sortOrder = Object.keys(sectionCache).length;

      const { data: section, error } = await supabase
        .from("paper_sections")
        .insert({
          paper_id: paperId,
          title: inferSectionTitle(sectionType),
          section_type: sectionType,
          instruction: null,
          score: null,
          sort_order: sortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      sectionCache[sectionType] = section.id;
      sectionOrderMap[sectionType] = 0;

      return section.id;
    }

    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      try {
        const questionBody = normalizeText(item.question?.body);
        const normalizedType = normalizeQuestionType(item.question?.type || item.type);
        const sectionType = inferSectionType(item);

        if (!questionBody) {
          throw new Error("題目 body 是空的");
        }

        let passageId: string | null = null;
        let groupId: string | null = null;
        let optionSetId: string | null = null;

        const normalizedPassage = normalizeText(item.passage);

        if (normalizedPassage) {
          if (passageCache[normalizedPassage]) {
            passageId = passageCache[normalizedPassage];
          } else {
            const { data: existingPassages, error: passageFindError } =
              await supabase
                .from("passages")
                .select("id")
                .eq("content", normalizedPassage)
                .limit(1);

            if (passageFindError) throw passageFindError;

            if (existingPassages && existingPassages.length > 0) {
              passageId = existingPassages[0].id;
            } else {
              const { data: newPassage, error: passageInsertError } =
                await supabase
                  .from("passages")
                  .insert({
                    content: normalizedPassage,
                    title: item.group_title || null,
                    source: paperTitle,
                  })
                  .select()
                  .single();

              if (passageInsertError) throw passageInsertError;
              passageId = newPassage.id;
            }

            passageCache[normalizedPassage] = passageId!;
          }
        }

        if (item.group_type) {
          const groupKey = JSON.stringify({
            paper_id: paperId,
            group_type: item.group_type,
            group_title: item.group_title || "",
            passage_id: passageId || "",
            option_set_title: item.option_set?.title || "",
          });

          if (groupCache[groupKey]) {
            groupId = groupCache[groupKey];
          } else {
            const { data: newGroup, error: groupInsertError } = await supabase
              .from("question_groups")
              .insert({
                title: item.group_title || null,
                group_type: item.group_type,
                passage_id: passageId,
                instruction:
                  item.question?.instruction ||
                  item.option_set?.instruction ||
                  null,
                source: paperTitle,
              })
              .select()
              .single();

            if (groupInsertError) throw groupInsertError;

            groupId = newGroup.id;
            groupCache[groupKey] = groupId!;
          }
        }

        if (
          item.option_set &&
          item.option_set.items &&
          item.option_set.items.length > 0
        ) {
          const optionSetKey = JSON.stringify({
            paper_id: paperId,
            group_id: groupId || "",
            title: item.option_set.title || "",
            instruction: item.option_set.instruction || "",
            items: item.option_set.items.map((x) => ({
              label: x.label || "",
              text: x.text,
              sort_order: x.sort_order,
            })),
          });

          if (optionSetCache[optionSetKey]) {
            optionSetId = optionSetCache[optionSetKey];
          } else {
            const { data: newOptionSet, error: optionSetInsertError } =
              await supabase
                .from("option_sets")
                .insert({
                  title: item.option_set.title || null,
                  instruction: item.option_set.instruction || null,
                  source: paperTitle,
                })
                .select()
                .single();

            if (optionSetInsertError) throw optionSetInsertError;

            optionSetId = newOptionSet.id;

            const optionSetItemsPayload = item.option_set.items.map((opt) => ({
              option_set_id: optionSetId,
              label: opt.label || null,
              text: opt.text,
              sort_order: opt.sort_order ?? 0,
            }));

            const { error: optionSetItemsInsertError } = await supabase
              .from("option_set_items")
              .insert(optionSetItemsPayload);

            if (optionSetItemsInsertError) throw optionSetItemsInsertError;

            optionSetCache[optionSetKey] = optionSetId!;
          }
        }

        let questionId: string | null = null;

        const { data: existingQuestions, error: existingQuestionError } =
          await supabase
            .from("questions")
            .select("id")
            .eq("body", questionBody)
            .eq("type", normalizedType)
            .limit(1);

        if (existingQuestionError) throw existingQuestionError;

        if (existingQuestions && existingQuestions.length > 0) {
          questionId = existingQuestions[0].id;
          reusedQuestions++;
        } else {
          const { data: insertedQuestion, error: questionInsertError } =
            await supabase
              .from("questions")
              .insert({
                body: questionBody,
                type: normalizedType,
                difficulty: item.question?.difficulty || "medium",
                passage_id: passageId,
                group_id: groupId,
                option_set_id: optionSetId,
                question_no: item.question_no ?? null,
                instruction: item.question?.instruction || null,
                answer_text: item.question?.answer_text || null,
                meta_json: item.question?.meta_json || {},
              })
              .select()
              .single();

          if (questionInsertError) throw questionInsertError;

          questionId = insertedQuestion.id;
          insertedQuestions++;

          if (Array.isArray(item.options) && item.options.length > 0) {
            const optionPayload = item.options.map((opt, optionIndex) => ({
              question_id: questionId,
              label: opt.label || null,
              text: opt.text,
              is_correct: !!opt.is_correct,
              sort_order: optionIndex,
            }));

            const { error: optionsInsertError } = await supabase
              .from("options")
              .insert(optionPayload);

            if (optionsInsertError) throw optionsInsertError;
          }

          if (Array.isArray(item.tags) && item.tags.length > 0) {
            for (const tag of item.tags) {
              if (!tag.name || !tag.category) continue;

              const tagKey = `${tag.category}::${tag.name}`;
              let tagId: string | null = null;

              if (tagCache[tagKey]) {
                tagId = tagCache[tagKey];
              } else {
                const { data: existingTags, error: tagQueryError } =
                  await supabase
                    .from("tags")
                    .select("id")
                    .eq("name", tag.name)
                    .eq("category", tag.category)
                    .limit(1);

                if (tagQueryError) throw tagQueryError;

                if (existingTags && existingTags.length > 0) {
                  tagId = existingTags[0].id;
                } else {
                  const { data: newTag, error: tagInsertError } = await supabase
                    .from("tags")
                    .insert({
                      name: tag.name,
                      category: tag.category,
                    })
                    .select()
                    .single();

                  if (tagInsertError) throw tagInsertError;

                  tagId = newTag.id;
                }

                tagCache[tagKey] = tagId!;
              }

              const { error: questionTagInsertError } = await supabase
                .from("question_tags")
                .insert({
                  question_id: questionId,
                  tag_id: tagId,
                });

              if (
                questionTagInsertError &&
                !String(questionTagInsertError.message || "")
                  .toLowerCase()
                  .includes("duplicate")
              ) {
                throw questionTagInsertError;
              }
            }
          }
        }

        const sectionId = await getOrCreateSection(sectionType);

        const { data: existingPaperItem, error: existingPaperItemError } =
          await supabase
            .from("paper_items")
            .select("id")
            .eq("paper_id", paperId)
            .eq("question_id", questionId)
            .limit(1);

        if (existingPaperItemError) throw existingPaperItemError;

        if (!existingPaperItem || existingPaperItem.length === 0) {
          const { error: paperItemError } = await supabase
            .from("paper_items")
            .insert({
              paper_id: paperId,
              section_id: sectionId,
              question_id: questionId,
              group_id: groupId,
              sort_order: globalSortOrder,
              score: inferScore(item),
            });

          if (paperItemError) throw paperItemError;

          insertedPaperItems++;
          globalSortOrder++;
        }
      } catch (itemError: any) {
        console.error("❌ 單題匯入失敗", {
          index,
          question_no: item?.question_no,
          type: item?.type,
          body: item?.question?.body?.slice?.(0, 80),
          error: itemError,
        });

        failures.push({
          index,
          question_no: item?.question_no ?? null,
          type: item?.type ?? item?.question?.type ?? null,
          body: item?.question?.body?.slice?.(0, 120) || null,
          error: serializeError(itemError),
        });
      }
    }

    return NextResponse.json(
      {
        success: failures.length === 0,
        paper_id: paperId,
        paper_title: paperTitle,
        received_count: items.length,
        inserted_questions: insertedQuestions,
        reused_questions: reusedQuestions,
        inserted_paper_items: insertedPaperItems,
        failed_count: failures.length,
        failures,
      },
      { status: failures.length === 0 ? 200 : 207 }
    );
  } catch (err: any) {
    console.error("import fatal error:", err);

    return NextResponse.json(
      {
        success: false,
        error: err?.message || String(err),
        details: serializeError(err),
      },
      { status: 500 }
    );
  }
}