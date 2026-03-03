import chalk from "chalk";
import inquirer from "inquirer";
import ora, { Ora } from "ora";
import { SmartCommitConfig } from "./config";

/** User action after seeing the generated commit message */
export type UserAction = "accept" | "abort" | "edit";

/**
 * Displays the generated commit message with syntax highlighting.
 * @param message - The commit message to display
 */
export function displayCommitMessage(message: string): void {
  console.log();
  console.log(chalk.bold("Generated commit message:"));
  console.log();

  // Parse and colorize the conventional commit format
  const match = message.match(/^(\w+)(\(.+?\))?(!)?:\s(.+)$/);

  if (match) {
    const [, type, scope, breaking, description] = match;
    let formatted = chalk.green.bold(type);

    if (scope) {
      formatted += chalk.yellow(scope);
    }

    if (breaking) {
      formatted += chalk.red.bold("!");
    }

    formatted += chalk.white(": ") + chalk.cyan(description);
    console.log("  " + formatted);
  } else {
    console.log("  " + chalk.cyan(message));
  }

  console.log();
}

/**
 * Prompts the user to accept, abort, or edit the generated commit message.
 * @returns The user's chosen action
 */
export async function promptUserAction(): Promise<UserAction> {
  const { action } = await inquirer.prompt<{ action: string }>([
    {
      type: "list",
      name: "action",
      message: "Use this message?",
      choices: [
        { name: "Yes - commit with this message", value: "accept", short: "Y" },
        { name: "No - abort", value: "abort", short: "n" },
        { name: "Edit - open in $EDITOR", value: "edit", short: "e" },
      ],
    },
  ]);

  return action as UserAction;
}

/**
 * Opens the user's $EDITOR to edit the commit message.
 * @param message - The initial commit message to edit
 * @returns The edited commit message
 */
export async function editMessage(message: string): Promise<string> {
  const { edited } = await inquirer.prompt<{ edited: string }>([
    {
      type: "editor",
      name: "edited",
      message: "Edit commit message:",
      default: message,
    },
  ]);

  return edited.trim();
}

/**
 * Creates and starts a loading spinner with the given text.
 * @param text - The text to display alongside the spinner
 * @returns The ora spinner instance
 */
export function startSpinner(text: string): Ora {
  return ora({ text, color: "cyan" }).start();
}

/**
 * Displays an error message in red.
 * @param message - The error message to display
 */
export function showError(message: string): void {
  console.error(chalk.red.bold("Error: ") + chalk.red(message));
}

/**
 * Displays a success message in green.
 * @param message - The success message to display
 */
export function showSuccess(message: string): void {
  console.log(chalk.green.bold("✔ ") + chalk.green(message));
}

/**
 * Displays a warning message in yellow.
 * @param message - The warning message to display
 */
export function showWarning(message: string): void {
  console.log(chalk.yellow.bold("⚠ ") + chalk.yellow(message));
}

/**
 * Runs the interactive configuration wizard using inquirer.
 * @param currentConfig - The current configuration to use as defaults
 * @returns The updated configuration
 */
export async function runConfigWizard(
  currentConfig: SmartCommitConfig
): Promise<Partial<SmartCommitConfig>> {
  console.log();
  console.log(chalk.bold.cyan("Smart Commit Configuration Wizard"));
  console.log(chalk.gray("Configure your smart-commit settings.\n"));

  const answers = await inquirer.prompt<{
    apiKey: string;
    model: string;
    maxDiffLines: number;
    language: string;
    includeScope: boolean;
    temperature: number;
  }>([
    {
      type: "password",
      name: "apiKey",
      message: "Anthropic API Key:",
      default: currentConfig.apiKey ? "••••••••" : undefined,
      mask: "*",
      validate: (input: string): boolean | string => {
        if (!input || input === "••••••••") return true;
        if (input.startsWith("sk-")) return true;
        return "API key should start with 'sk-'";
      },
    },
    {
      type: "input",
      name: "model",
      message: "Claude model:",
      default: currentConfig.model,
    },
    {
      type: "number",
      name: "maxDiffLines",
      message: "Max diff lines:",
      default: currentConfig.maxDiffLines,
      validate: (input: number): boolean | string => {
        if (input > 0 && input <= 10000) return true;
        return "Must be between 1 and 10000";
      },
    },
    {
      type: "input",
      name: "language",
      message: "Commit message language:",
      default: currentConfig.language,
    },
    {
      type: "confirm",
      name: "includeScope",
      message: "Include scope in commit messages?",
      default: currentConfig.includeScope,
    },
    {
      type: "number",
      name: "temperature",
      message: "AI temperature (0-1):",
      default: currentConfig.temperature,
      validate: (input: number): boolean | string => {
        if (input >= 0 && input <= 1) return true;
        return "Must be between 0 and 1";
      },
    },
  ]);

  // Don't overwrite API key if user kept the masked default
  const result: Partial<SmartCommitConfig> = {
    model: answers.model,
    maxDiffLines: answers.maxDiffLines,
    language: answers.language,
    includeScope: answers.includeScope,
    temperature: answers.temperature,
  };

  if (answers.apiKey && answers.apiKey !== "••••••••") {
    result.apiKey = answers.apiKey;
  }

  return result;
}
