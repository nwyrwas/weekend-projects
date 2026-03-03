import Anthropic from "@anthropic-ai/sdk";
import { SmartCommitConfig } from "./config";
import { buildSystemPrompt, buildUserPrompt, PromptOptions } from "./prompt";

/** Options for generating a commit message */
export interface GenerateOptions {
  /** The git diff to analyze */
  diff: string;
  /** Force a specific commit type */
  forcedType?: string;
}

/** Maximum number of retry attempts for API calls */
const MAX_RETRIES = 3;

/** Base delay in milliseconds for exponential backoff */
const BASE_DELAY_MS = 1000;

/**
 * Pauses execution for the specified number of milliseconds.
 * @param ms - The number of milliseconds to sleep
 * @returns A promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generates a conventional commit message using the Anthropic Claude API.
 * Includes retry logic with exponential backoff for transient failures.
 * @param config - The smart-commit configuration
 * @param options - Options including the diff and optional forced type
 * @returns The generated commit message string
 * @throws Error if all retry attempts fail
 */
export async function generateCommitMessage(
  config: SmartCommitConfig,
  options: GenerateOptions
): Promise<string> {
  const client = new Anthropic({ apiKey: config.apiKey });

  const promptOptions: PromptOptions = {
    language: config.language,
    includeScope: config.includeScope,
    forcedType: options.forcedType,
  };

  const systemPrompt = buildSystemPrompt(promptOptions);
  const userPrompt = buildUserPrompt(options.diff);

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: config.model,
        max_tokens: 256,
        temperature: config.temperature,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("No text content in API response");
      }

      return textBlock.text.trim();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Failed to generate commit message after ${MAX_RETRIES} attempts: ${lastError?.message ?? "Unknown error"}`
  );
}
