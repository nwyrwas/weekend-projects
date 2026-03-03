#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { loadConfig, saveConfig, validateApiKey, getConfigPath } from "./config";
import { getStagedDiff, hasStagedChanges, createCommit, truncateDiff } from "./git";
import { generateCommitMessage } from "./ai";
import {
  displayCommitMessage,
  promptUserAction,
  editMessage,
  startSpinner,
  showError,
  showSuccess,
  showWarning,
  runConfigWizard,
} from "./ui";

/**
 * Runs the main smart-commit workflow: gets staged diff, generates a commit message,
 * and prompts the user to accept, edit, or abort.
 * @param argv - Parsed command line arguments
 */
async function run(argv: {
  dryRun?: boolean;
  type?: string;
  lang?: string;
  model?: string;
}): Promise<void> {
  // Load configuration
  const config = loadConfig();

  // Apply CLI overrides
  if (argv.lang) {
    config.language = argv.lang;
  }
  if (argv.model) {
    config.model = argv.model;
  }

  // Validate API key
  if (!validateApiKey(config)) {
    showError(
      "No API key found. Set ANTHROPIC_API_KEY environment variable or run 'smart-commit config'."
    );
    process.exit(1);
  }

  // Check for staged changes
  const hasChanges = await hasStagedChanges();
  if (!hasChanges) {
    showError("No staged changes found.");
    showWarning("Tip: Use 'git add <files>' to stage changes before running smart-commit.");
    process.exit(1);
  }

  // Get staged diff
  let diff = await getStagedDiff();

  // Truncate if needed
  const { diff: processedDiff, truncated } = truncateDiff(diff, config.maxDiffLines);
  if (truncated) {
    showWarning(
      `Diff exceeds ${config.maxDiffLines} lines. Truncated to fit. Consider increasing maxDiffLines in config.`
    );
    diff = processedDiff;
  }

  // Generate commit message
  const spinner = startSpinner("Generating commit message...");

  try {
    const message = await generateCommitMessage(config, {
      diff,
      forcedType: argv.type,
    });

    spinner.stop();

    displayCommitMessage(message);

    // Dry run mode - just print and exit
    if (argv.dryRun) {
      showWarning("Dry run mode - no commit created.");
      return;
    }

    // Prompt user for action
    const action = await promptUserAction();

    switch (action) {
      case "accept": {
        await createCommit(message);
        showSuccess("Committed successfully!");
        break;
      }
      case "edit": {
        const edited = await editMessage(message);
        if (edited) {
          await createCommit(edited);
          showSuccess("Committed successfully!");
        } else {
          showWarning("Empty message. Commit aborted.");
        }
        break;
      }
      case "abort": {
        showWarning("Commit aborted.");
        break;
      }
    }
  } catch (error) {
    spinner.stop();
    const errorMessage = error instanceof Error ? error.message : String(error);
    showError(`Failed to generate commit message: ${errorMessage}`);
    process.exit(1);
  }
}

/**
 * Runs the interactive configuration wizard and saves the result.
 */
async function runConfig(): Promise<void> {
  const currentConfig = loadConfig();
  const newConfig = await runConfigWizard(currentConfig);
  saveConfig(newConfig);
  showSuccess(`Configuration saved to ${getConfigPath()}`);
}

/**
 * CLI entry point. Parses arguments with yargs and routes to the appropriate handler.
 */
async function main(): Promise<void> {
  const parser = yargs(hideBin(process.argv))
    .scriptName("smart-commit")
    .usage("$0 [options]")
    .command(
      "$0",
      "Generate an AI-powered conventional commit message",
      (yargs) =>
        yargs
          .option("dry-run", {
            type: "boolean",
            describe: "Print the message but don't commit",
            default: false,
          })
          .option("type", {
            type: "string",
            describe: "Force a specific commit type (e.g., feat, fix, docs)",
          })
          .option("lang", {
            type: "string",
            describe: "Generate message in a specific language",
          })
          .option("model", {
            type: "string",
            describe: "Override the Claude model to use",
          }),
      async (argv) => {
        await run(argv);
      }
    )
    .command("config", "Open the interactive configuration wizard", {}, async () => {
      await runConfig();
    })
    .version()
    .help()
    .alias("h", "help")
    .strict();

  await parser.parse();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  showError(message);
  process.exit(1);
});
