/** Options for building the system prompt */
export interface PromptOptions {
  /** Language for the commit message */
  language: string;
  /** Whether to include a scope in the commit message */
  includeScope: boolean;
  /** Force a specific commit type (e.g., "feat", "fix") */
  forcedType?: string;
}

/** Valid conventional commit types */
const COMMIT_TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "chore",
  "ci",
  "build",
  "revert",
] as const;

/**
 * Builds the system prompt for the AI model to generate a conventional commit message.
 * @param options - Configuration options for the prompt
 * @returns The system prompt string
 */
export function buildSystemPrompt(options: PromptOptions): string {
  const { language, includeScope, forcedType } = options;

  const scopeInstruction = includeScope
    ? "Include a scope in parentheses when it can be clearly inferred from the changes (e.g., feat(auth): ...)."
    : "Do NOT include a scope. Use only the type and description (e.g., feat: ...).";

  const typeInstruction = forcedType
    ? `Use the commit type "${forcedType}" regardless of the changes.`
    : `Choose the most appropriate commit type from: ${COMMIT_TYPES.join(", ")}.`;

  const languageInstruction =
    language.toLowerCase() === "english"
      ? ""
      : `Write the commit message description in ${language}.`;

  return `You are an expert at writing concise, meaningful git commit messages following the Conventional Commits v1.0.0 specification.

Analyze the provided git diff and generate a single commit message.

Rules:
1. ${typeInstruction}
2. ${scopeInstruction}
3. The description must be lowercase, imperative mood, and no longer than 72 characters.
4. Do not end the description with a period.
5. Focus on WHAT changed and WHY, not HOW.
6. If there are multiple changes, summarize the most important one.
${languageInstruction ? `7. ${languageInstruction}` : ""}

Respond with ONLY the commit message. No explanations, no quotes, no markdown formatting.`;
}

/**
 * Builds the user prompt containing the diff to analyze.
 * @param diff - The git diff to include in the prompt
 * @returns The user prompt string
 */
export function buildUserPrompt(diff: string): string {
  return `Generate a conventional commit message for the following git diff:\n\n${diff}`;
}
