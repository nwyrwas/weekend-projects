import execa from "execa";

/**
 * Retrieves the staged diff from git.
 * @returns The output of `git diff --staged`
 * @throws Error if the git command fails
 */
export async function getStagedDiff(): Promise<string> {
  const { stdout } = await execa("git", ["diff", "--staged"]);
  return stdout;
}

/**
 * Checks whether there are any staged changes in the git repository.
 * @returns True if there are staged changes
 */
export async function hasStagedChanges(): Promise<boolean> {
  const { stdout } = await execa("git", ["diff", "--staged", "--name-only"]);
  return stdout.trim().length > 0;
}

/**
 * Creates a git commit with the provided message.
 * @param message - The commit message to use
 * @throws Error if the git commit command fails
 */
export async function createCommit(message: string): Promise<void> {
  await execa("git", ["commit", "-m", message]);
}

/**
 * Truncates a diff to a maximum number of lines with a warning.
 * @param diff - The full diff string
 * @param maxLines - The maximum number of lines to keep
 * @returns An object containing the truncated diff and whether truncation occurred
 */
export function truncateDiff(diff: string, maxLines: number): { diff: string; truncated: boolean } {
  const lines = diff.split("\n");

  if (lines.length <= maxLines) {
    return { diff, truncated: false };
  }

  const truncatedLines = lines.slice(0, maxLines);
  return {
    diff: truncatedLines.join("\n"),
    truncated: true,
  };
}
