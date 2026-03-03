import { generateCommitMessage } from "../src/ai";
import { SmartCommitConfig } from "../src/config";
import { buildSystemPrompt, buildUserPrompt } from "../src/prompt";

// Mock the Anthropic SDK
jest.mock("@anthropic-ai/sdk", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
      },
    })),
  };
});

import Anthropic from "@anthropic-ai/sdk";

const MockAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

describe("ai", () => {
  const mockConfig: SmartCommitConfig = {
    apiKey: "sk-test-key",
    model: "claude-3-5-haiku-20241022",
    maxDiffLines: 500,
    language: "english",
    includeScope: true,
    temperature: 0.3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("generateCommitMessage", () => {
    it("should return the generated commit message", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [{ type: "text", text: "feat(auth): add login endpoint" }],
      });

      MockAnthropic.mockImplementation(
        () =>
          ({
            messages: { create: mockCreate },
          }) as unknown as Anthropic
      );

      const result = await generateCommitMessage(mockConfig, {
        diff: "diff content",
      });

      expect(result).toBe("feat(auth): add login endpoint");
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 256,
          temperature: 0.3,
        })
      );
    });

    it("should pass forced type to the prompt", async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [{ type: "text", text: "fix: resolve null pointer" }],
      });

      MockAnthropic.mockImplementation(
        () =>
          ({
            messages: { create: mockCreate },
          }) as unknown as Anthropic
      );

      const result = await generateCommitMessage(mockConfig, {
        diff: "diff content",
        forcedType: "fix",
      });

      expect(result).toBe("fix: resolve null pointer");
    });

    it("should retry on API failure", async () => {
      jest.useFakeTimers();

      const mockCreate = jest
        .fn()
        .mockRejectedValueOnce(new Error("API error"))
        .mockRejectedValueOnce(new Error("API error"))
        .mockResolvedValue({
          content: [{ type: "text", text: "feat: add feature" }],
        });

      MockAnthropic.mockImplementation(
        () =>
          ({
            messages: { create: mockCreate },
          }) as unknown as Anthropic
      );

      const promise = generateCommitMessage(mockConfig, { diff: "diff" });

      // Advance through retry delays
      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(2000);

      const result = await promise;

      expect(result).toBe("feat: add feature");
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it("should throw after max retries", async () => {
      jest.useFakeTimers();

      const mockCreate = jest.fn().mockRejectedValue(new Error("API error"));

      MockAnthropic.mockImplementation(
        () =>
          ({
            messages: { create: mockCreate },
          }) as unknown as Anthropic
      );

      const promise = generateCommitMessage(mockConfig, { diff: "diff" });

      // Attach rejection handler BEFORE advancing timers to avoid unhandled rejection
      const assertion = expect(promise).rejects.toThrow(
        "Failed to generate commit message after 3 attempts"
      );

      // Advance through all retry delays
      await jest.advanceTimersByTimeAsync(10000);

      await assertion;
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it("should throw when response has no text content", async () => {
      jest.useFakeTimers();

      const mockCreate = jest.fn().mockResolvedValue({
        content: [],
      });

      MockAnthropic.mockImplementation(
        () =>
          ({
            messages: { create: mockCreate },
          }) as unknown as Anthropic
      );

      const promise = generateCommitMessage(mockConfig, { diff: "diff" });

      // Attach rejection handler BEFORE advancing timers
      const assertion = expect(promise).rejects.toThrow(
        "Failed to generate commit message after 3 attempts"
      );

      // Advance through all retry delays
      await jest.advanceTimersByTimeAsync(10000);

      await assertion;
    });
  });

  describe("prompt building", () => {
    it("should include scope instruction when includeScope is true", () => {
      const prompt = buildSystemPrompt({
        language: "english",
        includeScope: true,
      });

      expect(prompt).toContain("Include a scope");
    });

    it("should exclude scope when includeScope is false", () => {
      const prompt = buildSystemPrompt({
        language: "english",
        includeScope: false,
      });

      expect(prompt).toContain("Do NOT include a scope");
    });

    it("should include forced type when provided", () => {
      const prompt = buildSystemPrompt({
        language: "english",
        includeScope: true,
        forcedType: "feat",
      });

      expect(prompt).toContain('"feat"');
    });

    it("should include language instruction for non-English", () => {
      const prompt = buildSystemPrompt({
        language: "spanish",
        includeScope: true,
      });

      expect(prompt).toContain("spanish");
    });

    it("should build user prompt with diff", () => {
      const prompt = buildUserPrompt("some diff content");

      expect(prompt).toContain("some diff content");
    });
  });
});
