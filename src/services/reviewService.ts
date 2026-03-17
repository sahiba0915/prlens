import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { analyze, buildFileReviewPrompt, LlmApiError } from "./ai.service.js";
import { ReviewError } from "./reviewErrors.js";

export type ReviewFileOptions = {
  /**
   * Maximum characters to send to the LLM.
   * Large files are truncated from the end.
   */
  maxChars?: number;
};

export type ReviewResult = {
  filePath: string;
  bytesRead: number;
  truncated: boolean;
  maxChars: number;
  aiRaw: string;
};

type NodeErrno = Error & { code?: string };

function errnoCode(err: unknown): string | undefined {
  return err instanceof Error && "code" in err ? (err as NodeErrno).code : undefined;
}

function normalizeMaxChars(input: number | undefined): number {
  const n = input ?? 12_000;
  if (!Number.isFinite(n) || n <= 500) return 12_000;
  return Math.floor(n);
}

function truncateToChars(text: string, maxChars: number): { text: string; truncated: boolean } {
  if (text.length <= maxChars) return { text, truncated: false };
  return { text: text.slice(0, maxChars), truncated: true };
}

async function readUtf8UpToChars(
  filePath: string,
  maxChars: number
): Promise<{ text: string; truncated: boolean }> {
  return await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding: "utf8" });
    let acc = "";
    let truncated = false;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      resolve(truncateToChars(acc, maxChars));
    };

    stream.on("data", (chunk: string | Buffer) => {
      if (done) return;
      acc += typeof chunk === "string" ? chunk : chunk.toString("utf8");
      if (acc.length > maxChars) {
        truncated = true;
        acc = acc.slice(0, maxChars);
        stream.destroy();
      }
    });

    stream.on("error", (err) => {
      if (done) return;
      // If we intentionally destroyed after truncation, treat as success.
      if (truncated) return finish();
      reject(err);
    });

    stream.on("end", () => finish());
    stream.on("close", () => finish());
  });
}

async function validateFilePath(filePath: string): Promise<{ bytes: number }> {
  try {
    const st = await stat(filePath);
    if (!st.isFile()) throw new ReviewError("NOT_A_FILE", `Not a file: ${filePath}`);
    return { bytes: st.size };
  } catch (err: unknown) {
    const code = errnoCode(err);
    if (code === "ENOENT") throw new ReviewError("FILE_NOT_FOUND", `File not found: ${filePath}`, undefined, err);
    if (code === "EACCES") throw new ReviewError("PERMISSION_DENIED", `Permission denied reading file: ${filePath}`, undefined, err);
    if (err instanceof ReviewError) throw err;
    throw new ReviewError("FILE_READ_FAILED", `Unable to access file: ${filePath}`, err instanceof Error ? err.message : String(err), err);
  }
}

async function readFileForReview(filePath: string, maxChars: number): Promise<{ content: string; truncated: boolean }> {
  try {
    const r = await readUtf8UpToChars(filePath, maxChars);
    return { content: r.text, truncated: r.truncated };
  } catch (err: unknown) {
    const code = errnoCode(err);
    if (code === "ENOENT") throw new ReviewError("FILE_NOT_FOUND", `File not found: ${filePath}`, undefined, err);
    if (code === "EACCES") throw new ReviewError("PERMISSION_DENIED", `Permission denied reading file: ${filePath}`, undefined, err);
    throw new ReviewError("FILE_READ_FAILED", `Failed to read file: ${filePath}`, err instanceof Error ? err.message : String(err), err);
  }
}

function buildPrompt(content: string, truncated: boolean, maxChars: number): string {
  return buildFileReviewPrompt(
    truncated
      ? `${content}\n\n[Note: file was truncated to ${maxChars.toLocaleString()} characters for analysis.]`
      : content
  );
}

async function analyzePrompt(prompt: string): Promise<string> {
  try {
    return await analyze(prompt);
  } catch (err: unknown) {
    if (err instanceof LlmApiError) {
      throw new ReviewError("AI_FAILED", err.message, err.details, err);
    }
    throw new ReviewError("AI_FAILED", err instanceof Error ? err.message : String(err), undefined, err);
  }
}

export async function reviewFile(filePath: string, options: ReviewFileOptions = {}): Promise<ReviewResult> {
  const maxChars = normalizeMaxChars(options.maxChars);
  const { bytes } = await validateFilePath(filePath);
  const { content, truncated } = await readFileForReview(filePath, maxChars);
  const prompt = buildPrompt(content, truncated, maxChars);
  const aiRaw = await analyzePrompt(prompt);
  return { filePath, bytesRead: bytes, truncated, maxChars, aiRaw };
}

