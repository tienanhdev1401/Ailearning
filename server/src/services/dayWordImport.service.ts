import { HttpStatusCode } from "axios";
import mammoth from "mammoth";
import { AppDataSource } from "../config/database";
import MiniGameType from "../enums/minigameType.enum";
import Skill from "../enums/skill.enum";
import { Activity } from "../models/activity";
import { Day } from "../models/day";
import { MiniGame } from "../models/minigame";
import { FlipCardMiniGame } from "../models/minigameImp/flip-card-minigame";
import { LessonMiniGame } from "../models/minigameImp/lesson-minigame";
import { SentenceBuilderMiniGame } from "../models/minigameImp/sentence_builder";
import { TrueFalseMiniGame } from "../models/minigameImp/true-false-minigame";
import { TypingChallengeMiniGame } from "../models/minigameImp/typing-challenge-minigame";
import ApiError from "../utils/ApiError";
import { geminiService } from "./ai-chat/gemini.service";

const SUPPORTED_OPTIONAL_MINIGAMES: MiniGameType[] = [
  MiniGameType.TRUE_FALSE,
  MiniGameType.SENTENCE_BUILDER,
  MiniGameType.TYPING_CHALLENGE,
  MiniGameType.FLIP_CARD,
];

const MINIGAME_DISPLAY_TITLES: Record<string, string> = {
  [MiniGameType.LESSON]: "Bài học lý thuyết",
  [MiniGameType.TRUE_FALSE]: "Trắc nghiệm Đúng/Sai",
  [MiniGameType.SENTENCE_BUILDER]: "Sắp xếp câu hoàn chỉnh",
  [MiniGameType.TYPING_CHALLENGE]: "Thử thách gõ phím",
  [MiniGameType.FLIP_CARD]: "Ôn tập Flashcard",
};

function getMinigameDisplayTitle(type: MiniGameType): string {
  return MINIGAME_DISPLAY_TITLES[type] || "Trò chơi học tập";
}


type ImportWordInput = {
  dayId: number;
  originalFileName: string;
  fileBuffer: Buffer;
  minigameTypes: MiniGameType[];
  activityTitle?: string;
};

// ── Gemini response types (clean, arrays only) ──────────────────────────

interface TrueFalseItem {
  statement: string;
  options: Array<{ key: "A" | "B"; label: string }>;
  correctOption: "A" | "B";
  explanation?: string;
}

interface SentenceBuilderItem {
  tokens: Array<{ id: number; text: string }>;
}

interface TypingChallengeItem {
  targetText: string;
  caseSensitive?: boolean;
  timeLimitSeconds?: number;
  hints?: string[];
}

interface FlipCardItem {
  cards: Array<{ term: string; definition: string }>;
}

interface GeminiPayload {
  lessonTitle: string;
  lessonContentHtml?: string;
  trueFalseItems?: TrueFalseItem[];
  sentenceBuilderItems?: SentenceBuilderItem[];
  typingChallengeItems?: TypingChallengeItem[];
  flipCardItems?: FlipCardItem[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ── JSON extraction utilities ───────────────────────────────────────────

function stripMarkdownFence(raw: string): string {
  return raw.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function extractJsonObject(raw: string): string | null {
  const firstBrace = raw.indexOf("{");
  if (firstBrace < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = firstBrace; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(firstBrace, i + 1);
      }
    }
  }

  return null;
}

function normalizeGeminiJson(raw: string): GeminiPayload {
  const cleaned = stripMarkdownFence(raw);

  try {
    return JSON.parse(cleaned) as GeminiPayload;
  } catch {
    const extracted = extractJsonObject(cleaned);
    if (!extracted) throw new Error("No JSON object found");
    return JSON.parse(extracted) as GeminiPayload;
  }
}

// ── Text processing utilities ───────────────────────────────────────────

function cleanSourceText(text: string): string {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace(/^\d+(\.\d+)*\.?\s+/, ""))
    .filter(line => !/^(stt|trang|page|hình|figure)\b/i.test(line))
    .join("\n");
}

function extractVocabPairs(sourceText: string): Array<{ word: string; meaning: string }> {
  const lines = sourceText
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const pairs: Array<{ word: string; meaning: string }> = [];
  for (const line of lines) {
    if (/^stt\b/i.test(line)) continue;

    const compact = line.replace(/\s{2,}/g, " ");
    const matched = compact.match(/^(\d+)\s+([A-Za-z][A-Za-z\s-]{1,40})\s+(.+)$/);
    if (!matched) continue;

    const word = matched[2].trim();
    let meaning = matched[3].trim();
    meaning = meaning.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim();
    if (!word || !meaning) continue;
    pairs.push({ word, meaning });
  }

  return pairs.slice(0, 20);
}

function extractGrammarRules(sourceText: string): string[] {
  const rules: string[] = [];
  const lines = sourceText.split(/\r?\n/);
  const formulaRegex = /([A-Z]\s*\+\s*[^.\n]+)|(cấu trúc:\s*[^.\n]+)|(form:\s*[^.\n]+)/gi;

  for (const line of lines) {
    const matches = line.match(formulaRegex);
    if (matches) {
      rules.push(...matches.map(m => m.trim()));
    }
  }
  return Array.from(new Set(rules)).slice(0, 10);
}

function extractExamples(sourceText: string): string[] {
  const examples: string[] = [];
  const lines = sourceText.split(/\r?\n/);
  const exampleMarker = /^(ví dụ|example|eg):?\s*(.+)$/i;
  const bulletPoint = /^[•\-\*]\s*(.+)$/;

  for (const line of lines) {
    const cleanLine = line.trim();
    const markerMatch = cleanLine.match(exampleMarker);
    const bulletMatch = cleanLine.match(bulletPoint);

    if (markerMatch) {
      examples.push(markerMatch[2].trim());
    } else if (bulletMatch && bulletMatch[1].length > 15 && bulletMatch[1].includes(" ")) {
      examples.push(bulletMatch[1].trim());
    }
  }
  return Array.from(new Set(examples)).slice(0, 15);
}

function extractTablesFromHtml(html: string): Array<{ word: string; meaning: string }> {
  const pairs: Array<{ word: string; meaning: string }> = [];
  const trRegex = /<tr>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<td>([\s\S]*?)<\/td>/gi;

  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const trContent = trMatch[1];
    const tds: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(trContent)) !== null) {
      const text = tdMatch[1].replace(/<[^>]*>?/gm, "").trim();
      if (text) tds.push(text);
    }

    if (tds.length >= 2) {
      const maybeNo = parseInt(tds[0]);
      const wordIndex = !isNaN(maybeNo) ? 1 : 0;
      const word = tds[wordIndex];
      const meaning = tds[tds.length - 1];

      if (/^(stt|no|word|term|definition|meaning|từ vựng|nghĩa|ví dụ)$/i.test(word)) continue;
      if (word.length > 50 || meaning.length > 300) continue;

      pairs.push({ word, meaning });
    }
  }
  return pairs;
}

function dedupeByKey<T>(items: T[], toKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = toKey(item).trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

// ── Content analysis & profiling ────────────────────────────────────────

function preprocessContent(sourceText: string, sourceHtml: string) {
  const tableVocab = extractTablesFromHtml(sourceHtml);
  const regexVocab = extractVocabPairs(sourceText);
  const grammarRules = extractGrammarRules(sourceText);
  const extractedExamples = extractExamples(sourceText);

  const dialogueLines = sourceText.split(/\r?\n/).filter(line => /^([A-Z][a-z]*|[A-Z])\s*:\s*.+/.test(line.trim()));
  const isDialogue = dialogueLines.length >= 3;

  const allVocab = dedupeByKey([...tableVocab, ...regexVocab], (v) => v.word);

  const sentences = sourceText
    .replace(/\t+/g, " ")
    .replace(/\s{2,}/g, " ")
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 20)
    .slice(0, 30);

  const isGrammarHeavy = grammarRules.length > 0 || extractedExamples.length > 3;
  const isVocabRich = allVocab.length > 5;
  const isNarrative = sentences.length > 8 && !isVocabRich && !isGrammarHeavy;

  let profile: "GRAMMAR" | "VOCABULARY" | "DIALOGUE" | "PROSE" | "MIXED" = "MIXED";
  if (isDialogue) profile = "DIALOGUE";
  else if (isGrammarHeavy) profile = "GRAMMAR";
  else if (isVocabRich) profile = "VOCABULARY";
  else if (isNarrative) profile = "PROSE";

  return {
    allVocab,
    grammarRules,
    extractedExamples,
    profile,
    cleanedSource: cleanSourceText(sourceText),
  };
}

function getProfileDirective(profile: string): { persona: string; focus: string } {
  switch (profile) {
    case "GRAMMAR":
      return {
        persona: "Senior Linguistics and Grammar Expert",
        focus: "Focus on testing grammar rules, tense usage, and structural patterns from the source. Create True/False statements about rule application. Sentence Builder should use the grammar patterns taught. Typing challenges should be example sentences using the taught grammar."
      };
    case "VOCABULARY":
      return {
        persona: "Lexicography and Vocabulary Acquisition Specialist",
        focus: "Focus on testing word meaning, usage in context, and synonyms/antonyms. True/False should test whether definitions are correct. FlipCards should pair words with rich definitions and example sentences. Sentence Builder should create sentences using the target vocabulary."
      };
    case "DIALOGUE":
      return {
        persona: "Conversational English and Communication Coach",
        focus: "Focus on natural conversation flow, appropriate responses, and idiomatic expressions. True/False should test conversational appropriateness. Sentence Builder should reconstruct dialogue lines. Typing challenges should be key dialogue exchanges."
      };
    case "PROSE":
      return {
        persona: "Advanced Reading Comprehension Specialist",
        focus: "Focus on main idea, inference, and evidence-based reasoning. True/False should test comprehension of key points (not literal copying). Sentence Builder should use important sentences from the passage. Typing challenges should be key thesis statements."
      };
    default:
      return {
        persona: "Senior ELT Specialist",
        focus: "Create balanced assessments covering both vocabulary and grammar from the source material."
      };
  }
}

// ── Validation & cleaning of AI output ──────────────────────────────────

function isValidTrueFalseItem(item: any): item is TrueFalseItem {
  if (!item || typeof item !== "object") return false;
  if (typeof item.statement !== "string" || item.statement.trim().length < 10) return false;
  if (!Array.isArray(item.options) || item.options.length !== 2) return false;
  if (!item.options.every((o: any) => o && (o.key === "A" || o.key === "B") && typeof o.label === "string")) return false;
  if (item.correctOption !== "A" && item.correctOption !== "B") return false;
  return true;
}

function isValidSentenceBuilderItem(item: any): item is SentenceBuilderItem {
  if (!item || typeof item !== "object") return false;
  if (!Array.isArray(item.tokens) || item.tokens.length < 3) return false;
  return item.tokens.every((t: any) => t && typeof t.id === "number" && typeof t.text === "string" && t.text.trim().length > 0);
}

function isValidTypingChallengeItem(item: any): item is TypingChallengeItem {
  if (!item || typeof item !== "object") return false;
  if (typeof item.targetText !== "string" || item.targetText.trim().length < 5) return false;
  if (item.targetText.length > 500) return false;
  return true;
}

function isValidFlipCardItem(item: any): item is FlipCardItem {
  if (!item || typeof item !== "object") return false;
  if (!Array.isArray(item.cards) || item.cards.length === 0) return false;
  return item.cards.every((c: any) =>
    c && typeof c.term === "string" && c.term.trim().length > 0 &&
    typeof c.definition === "string" && c.definition.trim().length > 0
  );
}

/**
 * Fisher-Yates shuffle — so Sentence Builder tokens are NOT in correct order.
 * Without this, the game is trivially solvable (tokens already in answer order).
 */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Validate + sanitize the entire Gemini payload.
 * Invalid items are dropped silently — better to have 3 good items than 5 bad ones.
 */
function validateAndCleanPayload(payload: GeminiPayload): GeminiPayload {
  const cleaned: GeminiPayload = {
    lessonTitle: typeof payload.lessonTitle === "string" && payload.lessonTitle.trim()
      ? payload.lessonTitle.trim()
      : "Imported Lesson",
    lessonContentHtml: payload.lessonContentHtml,
  };

  // ── True/False: validate each item ──
  if (Array.isArray(payload.trueFalseItems)) {
    cleaned.trueFalseItems = payload.trueFalseItems.filter(isValidTrueFalseItem);
  }

  // ── Sentence Builder: validate & shuffle tokens ──
  if (Array.isArray(payload.sentenceBuilderItems)) {
    cleaned.sentenceBuilderItems = payload.sentenceBuilderItems
      .filter(isValidSentenceBuilderItem)
      .map(item => ({
        tokens: shuffleArray(item.tokens),
      }));
  }

  // ── Typing Challenge: validate & enforce limits ──
  if (Array.isArray(payload.typingChallengeItems)) {
    cleaned.typingChallengeItems = payload.typingChallengeItems
      .filter(isValidTypingChallengeItem)
      .map(item => ({
        targetText: item.targetText.trim().slice(0, 500),
        caseSensitive: item.caseSensitive ?? false,
        timeLimitSeconds: Math.min(Math.max(item.timeLimitSeconds ?? 60, 15), 180),
        hints: Array.isArray(item.hints)
          ? item.hints.filter((h: any) => typeof h === "string" && h.trim()).slice(0, 5)
          : [],
      }));
  }

  // ── FlipCard: validate & trim ──
  if (Array.isArray(payload.flipCardItems)) {
    cleaned.flipCardItems = payload.flipCardItems
      .filter(isValidFlipCardItem)
      .map(item => ({
        cards: item.cards
          .filter(c => c.term.trim() && c.definition.trim())
          .map(c => ({ term: c.term.trim(), definition: c.definition.trim() })),
      }))
      .filter(item => item.cards.length > 0);
  }

  return cleaned;
}

// ── AI prompt construction ──────────────────────────────────────────────

function buildAiPrompt(
  preprocessed: ReturnType<typeof preprocessContent>,
  requestedTypes: MiniGameType[],
): string {
  const directive = getProfileDirective(preprocessed.profile);

  // Only request the minigame types the user actually selected
  const typeInstructions: string[] = [];

  if (requestedTypes.includes(MiniGameType.TRUE_FALSE)) {
    typeInstructions.push(`
"trueFalseItems": Generate 6-8 items. Each item:
  - "statement": A paraphrased claim about the source content (NOT a direct copy from the text). Must be a complete sentence, 15-200 chars.
  - "options": ALWAYS exactly [{"key":"A","label":"Đúng"},{"key":"B","label":"Sai"}]
  - "correctOption": "A" or "B" — mix them roughly 50/50, do NOT follow a pattern
  - "explanation": Vietnamese explanation of WHY the answer is correct (2-3 sentences)
  
  RULES for True/False:
  - NEVER copy a sentence verbatim from the source as the statement
  - Statements must require UNDERSTANDING the content to answer, not just word-matching
  - BAD: "The future perfect tense exists in English." (too obvious)
  - GOOD: "The Future Perfect tense is used to describe an action that will be completed before a specific point in the future." (tests understanding)
  - For "Sai" items: change a key detail (swap a word, change a number, invert a relationship) so it's clearly false
  - For "Đúng" items: rephrase the original fact in different words`);
  }

  if (requestedTypes.includes(MiniGameType.SENTENCE_BUILDER)) {
    typeInstructions.push(`
"sentenceBuilderItems": Generate 5-7 items. Each item:
  - "tokens": Array of {id, text} objects. IMPORTANT: tokens must be in SHUFFLED/RANDOM order (NOT the correct sentence order). The correct sentence is the one formed when tokens are sorted by their "id" field.
  - Each token.id represents the correct position (1 = first word, 2 = second word, etc.)
  - Each token.text is one word or short phrase
  - Minimum 4 tokens, maximum 12 tokens per sentence
  
  RULES for Sentence Builder:
  - Use grammatically correct, meaningful sentences from or inspired by the source
  - Token order in the array must be RANDOMIZED — if tokens appear in correct order, the game is broken
  - Example: Correct sentence "I will have finished" → tokens: [{"id":3,"text":"have"},{"id":1,"text":"I"},{"id":4,"text":"finished"},{"id":2,"text":"will"}]`);
  }

  if (requestedTypes.includes(MiniGameType.TYPING_CHALLENGE)) {
    typeInstructions.push(`
"typingChallengeItems": Generate 5-7 items. Each item:
  - "targetText": The exact text the user must type. Should be a complete, meaningful sentence (20-200 chars). Clean text only — no HTML, no special formatting.
  - "caseSensitive": false (always)
  - "timeLimitSeconds": 30-120 depending on length
  - "hints": 1-3 Vietnamese hints to help the user remember the sentence
  
  RULES for Typing Challenge:
  - targetText should be key sentences, definitions, or examples from the source
  - Keep sentences natural and useful for learning
  - Do NOT use very long paragraphs (max 200 characters)`);
  }

  if (requestedTypes.includes(MiniGameType.FLIP_CARD)) {
    typeInstructions.push(`
"flipCardItems": Generate 1-2 sets. Each set:
  - "cards": Array of 5-8 {term, definition} pairs
  - "term": The word, phrase, or concept
  - "definition": Clear definition WITH an example sentence. Format: "Definition. Example: ..."
  
  RULES for FlipCards:
  - BAD definition: "A word that appears in the text" (useless)
  - GOOD definition: "To finish successfully; to achieve. Example: She accomplished her goal of learning English."
  - Definitions should help the learner actually understand and remember the term
  - If the source has vocabulary pairs, use those. If not, extract key terms and define them.`);
  }

  const vocabContext = preprocessed.allVocab.length > 0
    ? `\nEXTRACTED VOCABULARY (use these when relevant):\n${preprocessed.allVocab.map(v => `- ${v.word}: ${v.meaning}`).join("\n")}`
    : "";

  const grammarContext = preprocessed.grammarRules.length > 0
    ? `\nEXTRACTED GRAMMAR RULES:\n${preprocessed.grammarRules.join("\n")}`
    : "";

  const exampleContext = preprocessed.extractedExamples.length > 0
    ? `\nEXTRACTED EXAMPLES:\n${preprocessed.extractedExamples.join("\n")}`
    : "";

  return `You are a ${directive.persona} creating English learning assessments.

TASK: Analyze the source content below and generate high-quality minigame data as JSON.

CONTENT PROFILE: ${preprocessed.profile}
STRATEGY: ${directive.focus}
${vocabContext}${grammarContext}${exampleContext}

SOURCE CONTENT:
${preprocessed.cleanedSource.slice(0, 8000)}

REQUIRED OUTPUT — a single JSON object with these fields:
{
  "lessonTitle": "Một tiêu đề học thuật mô tả cho bài học này (TUYỆT ĐỐI KHÔNG dùng tên file, hãy dựa vào nội dung văn bản)"${typeInstructions.length > 0 ? ",\n" + typeInstructions.join(",\n") : ""}
}

CRITICAL RULES:
1. Output ONLY valid JSON. No markdown, no comments, no wrapping.
2. All learning content in English. All explanations and hints in Vietnamese.
3. NEVER copy text verbatim from the source — always paraphrase and transform.
4. Every item must be pedagogically meaningful — no filler, no generic content.
5. Ensure variety — do not repeat the same pattern across items.`;
}

// ── Local fallback generator (no AI needed) ─────────────────────────────

/**
 * Extract ALL usable sentences from source — much more aggressive than the
 * regex-based extractors used for the AI prompt. Works with any document.
 */
function extractAllSentences(cleanedSource: string): string[] {
  // Tách theo dấu câu HOẶC xuống dòng để không bỏ lỡ nội dung
  const raw = cleanedSource
    .split(/(?<=[.!?])\s+|\r?\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 5 && s.length < 300); // Nới lỏng độ dài câu

  // Deduplicate
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of raw) {
    const key = s.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(s);
  }
  return result;
}

/**
 * Extract word-like pairs from raw lines using broad heuristics.
 * Catches patterns like "word - meaning", "word: meaning", "word\tmeaning", tab-separated columns, etc.
 */
function extractBroadVocab(cleanedSource: string): Array<{ word: string; meaning: string }> {
  const pairs: Array<{ word: string; meaning: string }> = [];
  const lines = cleanedSource.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Pattern: "word - meaning" or "word – meaning" or "word: meaning"
    const dashMatch = line.match(/^([A-Za-z][A-Za-z\s'-]{0,40})\s*[-–:]\s*(.{3,100})$/);
    if (dashMatch) {
      pairs.push({ word: dashMatch[1].trim(), meaning: dashMatch[2].trim() });
      continue;
    }

    // Pattern: tab-separated (word\tmeaning)
    const tabParts = line.split(/\t+/);
    if (tabParts.length >= 2) {
      const w = tabParts[0].trim();
      const m = tabParts[tabParts.length - 1].trim();
      if (w.length > 1 && w.length < 40 && m.length > 2 && /[a-zA-Z]/.test(w)) {
        pairs.push({ word: w, meaning: m });
        continue;
      }
    }

    // Pattern: numbered list "1. word meaning" or "1 word meaning"
    const numberedMatch = line.match(/^\d+[.)]\s*([A-Za-z][A-Za-z\s'-]{1,40})\s{2,}(.{3,100})$/);
    if (numberedMatch) {
      pairs.push({ word: numberedMatch[1].trim(), meaning: numberedMatch[2].trim() });
    }
  }

  return dedupeByKey(pairs, p => p.word).slice(0, 20);
}

function generateLocalFallback(
  preprocessed: ReturnType<typeof preprocessContent>,
  requestedTypes: MiniGameType[],
  fileName: string,
): GeminiPayload {
  const payload: GeminiPayload = {
    lessonTitle: fileName.replace(/\.[^/.]+$/, "").slice(0, 80) || "Bài học mới",
  };

  const { allVocab, grammarRules, extractedExamples, cleanedSource } = preprocessed;

  // Aggressive sentence extraction — works on ANY document
  const allSentences = extractAllSentences(cleanedSource);
  const shortSentences = allSentences.filter(s => {
    const wc = s.split(/\s+/).length;
    return wc >= 3 && wc <= 15; // Nhận diện các câu ngắn hiệu quả hơn
  });
  const mediumSentences = allSentences.filter(s => s.length >= 15 && s.length <= 250);

  // Supplement vocab with broad extraction if structured extraction found little
  const broadVocab = allVocab.length < 4
    ? dedupeByKey([...allVocab, ...extractBroadVocab(cleanedSource)], v => v.word)
    : allVocab;

  // ── TRUE_FALSE ──
  if (requestedTypes.includes(MiniGameType.TRUE_FALSE)) {
    const tfItems: TrueFalseItem[] = [];

    // From vocabulary pairs (true statements)
    for (const v of broadVocab.slice(0, 4)) {
      tfItems.push({
        statement: `"${v.word}" có nghĩa là "${v.meaning}".`,
        options: [{ key: "A", label: "Đúng" }, { key: "B", label: "Sai" }],
        correctOption: "A",
        explanation: `Đúng. "${v.word}" nghĩa là "${v.meaning}" theo nội dung bài học.`,
      });
    }

    // False statements (swap meanings between pairs)
    const vocabForFalse = broadVocab.slice(0, 6);
    for (let i = 0; i + 1 < vocabForFalse.length; i += 2) {
      tfItems.push({
        statement: `"${vocabForFalse[i].word}" có nghĩa là "${vocabForFalse[i + 1].meaning}".`,
        options: [{ key: "A", label: "Đúng" }, { key: "B", label: "Sai" }],
        correctOption: "B",
        explanation: `Sai. "${vocabForFalse[i].word}" nghĩa là "${vocabForFalse[i].meaning}", không phải "${vocabForFalse[i + 1].meaning}".`,
      });
    }

    // From grammar rules
    for (const rule of grammarRules.slice(0, 2)) {
      tfItems.push({
        statement: `Cấu trúc ngữ pháp: ${rule}`,
        options: [{ key: "A", label: "Đúng" }, { key: "B", label: "Sai" }],
        correctOption: "A",
        explanation: `Đúng. Đây là cấu trúc ngữ pháp được trình bày trong bài học.`,
      });
    }

    // From sentences — true/false about whether a sentence appears in content
    if (tfItems.length < 4) {
      const contentSentences = mediumSentences.slice(0, 6);
      for (let i = 0; i < contentSentences.length && tfItems.length < 8; i++) {
        const s = contentSentences[i];
        if (s.length < 15 || s.length > 150) continue;
        tfItems.push({
          statement: s,
          options: [{ key: "A", label: "Đúng" }, { key: "B", label: "Sai" }],
          correctOption: "A",
          explanation: `Đúng. Thông tin này được đề cập trong bài học.`,
        });
      }
    }

    if (tfItems.length > 0) payload.trueFalseItems = tfItems;
  }

  // ── SENTENCE_BUILDER ──
  if (requestedTypes.includes(MiniGameType.SENTENCE_BUILDER)) {
    // Prefer examples, then short sentences from the source
    const sbSource = [
      ...extractedExamples.filter(e => e.length > 15 && e.length < 120),
      ...shortSentences,
    ].slice(0, 6);

    const sbItems: SentenceBuilderItem[] = sbSource.map(sentence => {
      const clean = sentence.replace(/[.!?,;:]+$/g, "").trim();
      const words = clean.split(/\s+/).filter(Boolean);
      const tokens = words.map((word, idx) => ({ id: idx + 1, text: word }));
      return { tokens: shuffleArray(tokens) };
    }).filter(item => item.tokens.length >= 3);

    if (sbItems.length > 0) payload.sentenceBuilderItems = sbItems;
  }

  // ── TYPING_CHALLENGE ──
  if (requestedTypes.includes(MiniGameType.TYPING_CHALLENGE)) {
    const typingSources = [
      ...extractedExamples.filter(e => e.length >= 20 && e.length <= 200),
      ...mediumSentences,
    ].slice(0, 6);

    const tcItems: TypingChallengeItem[] = typingSources.map(text => ({
      targetText: text.trim(),
      caseSensitive: false,
      timeLimitSeconds: Math.min(Math.max(Math.ceil(text.length / 3), 20), 120),
      hints: ["Gõ lại câu trên chính xác."],
    }));

    if (tcItems.length > 0) payload.typingChallengeItems = tcItems;
  }

  // ── FLIP_CARD ──
  if (requestedTypes.includes(MiniGameType.FLIP_CARD)) {
    const cardVocab = broadVocab.slice(0, 10);
    if (cardVocab.length > 0) {
      payload.flipCardItems = [{
        cards: cardVocab.map(v => ({
          term: v.word,
          definition: v.meaning,
        })),
      }];
    }
  }

  console.log(`[DayWordImport] Local fallback generated: TF=${payload.trueFalseItems?.length ?? 0}, SB=${payload.sentenceBuilderItems?.length ?? 0}, TC=${payload.typingChallengeItems?.length ?? 0}, FC=${payload.flipCardItems?.length ?? 0}`);
  return payload;
}

// ── Gemini API call with retry ──────────────────────────────────────────

async function generateGeminiPayload(prompt: string): Promise<GeminiPayload> {
  const maxAttempts = 4;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const rawGemini = await geminiService.generate({
        prompt,
        temperature: 0.5,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      });
      return normalizeGeminiJson(rawGemini);
    } catch (error: any) {
      lastError = error;
      const msg = String(error?.message || "").toLowerCase();
      // Quota exceeded (limit: 0) is PERMANENT — never retry
      const isQuotaExhausted = msg.includes("quota") || msg.includes("billing");
      if (isQuotaExhausted) break;
      const retryable = msg.includes("high demand") || msg.includes("429") || msg.includes("503") || msg.includes("timeout");
      if (!retryable || attempt === maxAttempts) break;
      await sleep(800 * Math.pow(2, attempt - 1));
    }
  }

  throw lastError;
}

// ── Minigame type parsing ───────────────────────────────────────────────

function parseMinigameTypes(value: unknown): MiniGameType[] {
  if (!value) return [];

  const asArray = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [value];
        } catch {
          return value.split(",").map((item) => item.trim());
        }
      })()
      : [];

  const valid = asArray.filter((item): item is MiniGameType =>
    SUPPORTED_OPTIONAL_MINIGAMES.includes(item as MiniGameType)
  );

  return Array.from(new Set(valid));
}

// ── Main service ────────────────────────────────────────────────────────

export class DayWordImportService {
  static parseRequestedMinigameTypes(value: unknown): MiniGameType[] {
    return parseMinigameTypes(value);
  }

  static async importWordToDay(input: ImportWordInput) {
    // 1. Extract text & HTML from Word file
    const [textResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ buffer: input.fileBuffer }),
      mammoth.convertToHtml({ buffer: input.fileBuffer }),
    ]);
    const sourceText = textResult.value?.trim();
    const sourceHtml = htmlResult.value?.trim();

    if (!sourceText) {
      throw new ApiError(HttpStatusCode.BadRequest, "File Word không có nội dung để tạo lesson");
    }

    // 2. Analyze content
    const preprocessed = preprocessContent(sourceText, sourceHtml);

    // 3. Verify Day exists
    const dayRepo = AppDataSource.getRepository(Day);
    const activityRepo = AppDataSource.getRepository(Activity);

    const day = await dayRepo.findOne({ where: { id: input.dayId } });
    if (!day) {
      throw new ApiError(HttpStatusCode.NotFound, "Không tìm thấy day");
    }

    // 4. Generate AI content (only for requested minigame types)
    const aiPrompt = buildAiPrompt(preprocessed, input.minigameTypes);

    let payload: GeminiPayload;
    let usedFallback = false;
    try {
      const rawPayload = await generateGeminiPayload(aiPrompt);
      payload = validateAndCleanPayload(rawPayload);
    } catch (error) {
      const errorMsg = (error as Error)?.message || "Unknown error";
      if (errorMsg.includes("quota") || errorMsg.includes("limit")) {
        console.warn(`[DayWordImport] AI Quota exceeded limit. Using smart local fallback for ${input.originalFileName}`);
      } else {
        console.error("[DayWordImport] Gemini failed:", errorMsg);
      }
      payload = generateLocalFallback(preprocessed, input.minigameTypes, input.originalFileName);
      usedFallback = true;
    }

    // 5. Prepare lesson HTML
    const fullLessonHtml = sourceHtml || payload.lessonContentHtml || `<p>${sourceText}</p>`;

    // 6. Create activities & minigames in a transaction
    const existingCount = await activityRepo.count({ where: { day: { id: day.id } } });

    const created = await AppDataSource.transaction(async (manager) => {
      let nextOrder = existingCount + 1;
      const createdActivities: Activity[] = [];
      const createdMinigames: MiniGame[] = [];

      // Always create the Lesson activity
      const lessonActivity = manager.create(Activity, {
        day,
        order: nextOrder++,
        pointOfAc: 10,
        skill: Skill.READING,
        title: input.activityTitle?.trim() || payload.lessonTitle,
      });
      await manager.save(lessonActivity);
      createdActivities.push(lessonActivity);
      createdMinigames.push(
        await manager.save(
          new LessonMiniGame(
            payload.lessonTitle,
            { content: fullLessonHtml },
            lessonActivity
          )
        )
      );

      // Create each requested minigame type (only if we have valid data)
      for (const type of input.minigameTypes) {
        const minigamesToCreate: MiniGame[] = [];

        if (type === MiniGameType.TRUE_FALSE && payload.trueFalseItems?.length) {
          for (const item of payload.trueFalseItems) {
            minigamesToCreate.push(
              new TrueFalseMiniGame("Minigame True False", item, undefined as any)
            );
          }
        }

        if (type === MiniGameType.SENTENCE_BUILDER && payload.sentenceBuilderItems?.length) {
          for (const item of payload.sentenceBuilderItems) {
            minigamesToCreate.push(
              new SentenceBuilderMiniGame("Minigame Sentence Builder", item, undefined as any)
            );
          }
        }

        if (type === MiniGameType.TYPING_CHALLENGE && payload.typingChallengeItems?.length) {
          for (const item of payload.typingChallengeItems) {
            minigamesToCreate.push(
              new TypingChallengeMiniGame("Minigame Typing Challenge", item, undefined as any)
            );
          }
        }

        if (type === MiniGameType.FLIP_CARD && payload.flipCardItems?.length) {
          for (const item of payload.flipCardItems) {
            minigamesToCreate.push(
              new FlipCardMiniGame("Ôn tập từ vựng bằng flashcard", item, undefined as any)
            );
          }
        }

        // Only create activity if we have actual minigames for it
        if (minigamesToCreate.length > 0) {
          const activityForType = manager.create(Activity, {
            day,
            order: nextOrder++,
            pointOfAc: 10,
            skill: Skill.READING,
            title: getMinigameDisplayTitle(type),
          });
          await manager.save(activityForType);
          createdActivities.push(activityForType);

          // Set the activity reference on each minigame
          for (const mg of minigamesToCreate) {
            mg.activity = activityForType;
          }

          const saved = await manager.save(minigamesToCreate);
          createdMinigames.push(...(Array.isArray(saved) ? saved : [saved]));
        }
      }

      return { activities: createdActivities, minigames: createdMinigames };
    });

    const optionalCreated = created.minigames
      .map((item) => item.type)
      .filter((type) => type !== MiniGameType.LESSON);

    return {
      message: "Tạo activity từ Word thành công",
      dayId: day.id,
      activityId: created.activities[0]?.id,
      activityIds: created.activities.map((item) => item.id),
      lessonTitle: payload.lessonTitle,
      minigamesCreated: created.minigames.map((item) => item.type),
      activitiesCreated: created.activities.length,
      optionalCreated,
      optionalRequested: input.minigameTypes,
    };
  }
}
