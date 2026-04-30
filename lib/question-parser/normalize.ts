export function removeExamInstructions(raw: string) {
  let text = raw.replace(/\r/g, "");

  text = text.replace(
    /大學入學考試中心[\s\S]*?第壹部分、選擇題（占\d+分）/g,
    "第壹部分、選擇題"
  );

  text = text.replace(
    /－作答注意事項－[\s\S]*?第壹部分、選擇題/g,
    "第壹部分、選擇題"
  );

  text = text.replace(
    /請不要翻到次頁！[\s\S]*?第一部分：單題/g,
    "第一部分：單題"
  );

  text = text.replace(/^請不要翻到次頁！.*$/gm, "");
  text = text.replace(/^讀完本頁的說明.*$/gm, "");
  text = text.replace(/^請閱讀以下測驗作答說明.*$/gm, "");
  text = text.replace(/^測驗說明.*$/gm, "");
  text = text.replace(/^注意事項.*$/gm, "");
  text = text.replace(/^作答注意事項.*$/gm, "");
  text = text.replace(/^考試時間.*$/gm, "");
  text = text.replace(/^作答方式.*$/gm, "");
  text = text.replace(/^選擇題計分方式.*$/gm, "");
  text = text.replace(/^˙.*$/gm, "");
  text = text.replace(/^—.*$/gm, "");

  text = text.replace(/^第壹部分、選擇題.*$/gm, "");
  text = text.replace(/^第貳部分、混合題.*$/gm, "第貳部分、混合題");
  text = text.replace(/^第參部分、非選擇題.*$/gm, "第參部分、非選擇題");

  text = text.replace(/^說明[︰：].*$/gm, "");
  text = text.replace(/^\d+\s*$/gm, "");
  text = text.replace(/^請翻頁繼續作答.*$/gm, "");
  text = text.replace(/^試題結束.*$/gm, "");

  return text.trim();
}

export function normalizePDFText(raw: string) {
  let text = removeExamInstructions(raw);

  text = text.replace(/\n(\d+)\s+(?=[A-Z一-龥])/g, "\n$1. ");
  text = text.replace(/(\d+\.)\s*\n\s*/g, "$1 ");
  text = text.replace(/\s*\(([A-J])\)\s*/g, "\n($1) ");
  text = text.replace(/([^\n])(\d+\.)\s/g, "$1\n$2 ");

  text = text.replace(
    /([^\n])(一、|二、|三、|四、|五、|六、|第一部分|第二部分|第三部分|第壹部分|第貳部分|第參部分)/g,
    "$1\n$2"
  );

  text = text.replace(/([^\n])(\(\d+\s*-\s*\d+\))/g, "$1\n$2");
  text = text.replace(/([^\n])(第\d+至\d+題為題組)/g, "$1\n$2");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

export function normalizeLines(text: string) {
  return text.split("\n").map((line) => line.replace(/\r/g, ""));
}

export function isBlank(line: string) {
  return line.trim() === "";
}

export function normalizePassage(text: string) {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

export function detectDifficulty(body: string, passage = "") {
  const len = `${passage}\n${body}`.trim().length;
  if (len > 260) return "hard";
  if (len > 100) return "medium";
  return "easy";
}
