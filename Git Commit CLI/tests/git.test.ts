import { truncateDiff } from "../src/git";

// Mock execa - default export
jest.mock("execa", () => {
  const mockFn = jest.fn();
  return {
    __esModule: true,
    default: mockFn,
  };
});

import execa from "execa";
import { getStagedDiff, hasStagedChanges, createCommit } from "../src/git";

const mockExeca = execa as jest.MockedFunction<typeof execa>;

describe("git", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getStagedDiff", () => {
    it("should return the staged diff output", async () => {
      mockExeca.mockResolvedValue({
        stdout: "diff --git a/file.ts b/file.ts\n+added line",
        stderr: "",
        exitCode: 0,
      } as unknown as Awaited<ReturnType<typeof execa>>);

      const diff = await getStagedDiff();

      expect(mockExeca).toHaveBeenCalledWith("git", ["diff", "--staged"]);
      expect(diff).toBe("diff --git a/file.ts b/file.ts\n+added line");
    });

    it("should throw error when git command fails", async () => {
      mockExeca.mockRejectedValue(new Error("git error"));

      await expect(getStagedDiff()).rejects.toThrow("git error");
    });
  });

  describe("hasStagedChanges", () => {
    it("should return true when there are staged changes", async () => {
      mockExeca.mockResolvedValue({
        stdout: "src/file.ts\nsrc/other.ts",
        stderr: "",
        exitCode: 0,
      } as unknown as Awaited<ReturnType<typeof execa>>);

      const result = await hasStagedChanges();

      expect(mockExeca).toHaveBeenCalledWith("git", ["diff", "--staged", "--name-only"]);
      expect(result).toBe(true);
    });

    it("should return false when there are no staged changes", async () => {
      mockExeca.mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 0,
      } as unknown as Awaited<ReturnType<typeof execa>>);

      const result = await hasStagedChanges();

      expect(result).toBe(false);
    });
  });

  describe("createCommit", () => {
    it("should call git commit with the provided message", async () => {
      mockExeca.mockResolvedValue({
        stdout: "",
        stderr: "",
        exitCode: 0,
      } as unknown as Awaited<ReturnType<typeof execa>>);

      await createCommit("feat: add new feature");

      expect(mockExeca).toHaveBeenCalledWith("git", ["commit", "-m", "feat: add new feature"]);
    });
  });

  describe("truncateDiff", () => {
    it("should return the full diff when under the limit", () => {
      const diff = "line1\nline2\nline3";
      const result = truncateDiff(diff, 10);

      expect(result.diff).toBe(diff);
      expect(result.truncated).toBe(false);
    });

    it("should truncate diff when over the limit", () => {
      const lines = Array.from({ length: 100 }, (_, i) => `line${i + 1}`);
      const diff = lines.join("\n");
      const result = truncateDiff(diff, 50);

      expect(result.diff.split("\n")).toHaveLength(50);
      expect(result.truncated).toBe(true);
    });

    it("should handle exact limit correctly", () => {
      const lines = Array.from({ length: 50 }, (_, i) => `line${i + 1}`);
      const diff = lines.join("\n");
      const result = truncateDiff(diff, 50);

      expect(result.diff).toBe(diff);
      expect(result.truncated).toBe(false);
    });

    it("should handle empty diff", () => {
      const result = truncateDiff("", 500);

      expect(result.diff).toBe("");
      expect(result.truncated).toBe(false);
    });
  });
});
