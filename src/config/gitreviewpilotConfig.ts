import { readFile } from "node:fs/promises";
import path from "node:path";
import { logger } from "../utils/logger.js";

export type GitReviewPilotConfig = {
  /**
   * High-level areas to prioritize in AI output.
   * Treated as an ordered list (earlier = higher priority).
   */
  focus: string[];
};

export const DEFAULT_GITREVIEWPILOT_CONFIG: GitReviewPilotConfig = {
  focus: ["correctness", "security", "performance", "maintainability"]
};

type RawConfig = Record<string, unknown>;

function isObject(value: unknown): value is RawConfig {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const v of value) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (!trimmed) continue;
    if (!out.includes(trimmed)) out.push(trimmed);
  }
  return out;
}

function parseConfigJson(jsonText: string): GitReviewPilotConfig | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: unknown) {
    logger.warn(`Invalid gitreviewpilot.config.json (failed to parse JSON): ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }

  if (!isObject(parsed)) {
    logger.warn("Invalid gitreviewpilot.config.json (expected a JSON object).");
    return undefined;
  }

  const focus = normalizeStringArray(parsed.focus) ?? DEFAULT_GITREVIEWPILOT_CONFIG.focus;
  return { ...DEFAULT_GITREVIEWPILOT_CONFIG, focus };
}

let cachedConfig: GitReviewPilotConfig | undefined;

export async function loadConfig(cwd: string = process.cwd()): Promise<GitReviewPilotConfig> {
  if (cachedConfig) return cachedConfig;
  const configPath = path.join(cwd, "gitreviewpilot.config.json");

  try {
    const text = await readFile(configPath, "utf8");
    const parsed = parseConfigJson(text);
    cachedConfig = parsed ?? DEFAULT_GITREVIEWPILOT_CONFIG;
    logger.debug(`config loaded: ${configPath}`);
    return cachedConfig;
  } catch (err: unknown) {
    // Missing config file is normal; default config should apply silently.
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "ENOENT") {
      cachedConfig = DEFAULT_GITREVIEWPILOT_CONFIG;
      logger.debug(`config not found, using defaults: ${configPath}`);
      return cachedConfig;
    }
    cachedConfig = DEFAULT_GITREVIEWPILOT_CONFIG;
    logger.warn(
      `Failed to load gitreviewpilot.config.json, using defaults: ${err instanceof Error ? err.message : String(err)}`
    );
    return cachedConfig;
  }
}

/**
 * Returns the cached config if already loaded, otherwise returns defaults.
 * Prefer calling `loadConfig()` during app startup to avoid I/O mid-command.
 */
export function getConfig(): GitReviewPilotConfig {
  return cachedConfig ?? DEFAULT_GITREVIEWPILOT_CONFIG;
}

export function focusDirectiveForPrompt(defaultFocusText: string): string {
  const focus = getConfig().focus;
  if (!focus.length) return defaultFocusText;
  return `Focus areas (priority order): ${focus.join(", ")}.`;
}
