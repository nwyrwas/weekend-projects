import * as fs from "fs";
import * as path from "path";

const MOCK_HOMEDIR = "/mock/home";

// Must provide homedir return value in the factory so it's available at module load time
jest.mock("os", () => ({
  homedir: jest.fn().mockReturnValue("/mock/home"),
}));

jest.mock("fs");

const mockFs = fs as jest.Mocked<typeof fs>;

import { loadConfig, saveConfig, validateApiKey, getConfigPath } from "../src/config";

describe("config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ANTHROPIC_API_KEY;
  });

  describe("loadConfig", () => {
    it("should return default config when no config file exists", () => {
      mockFs.existsSync.mockReturnValue(false);

      const config = loadConfig();

      expect(config.model).toBe("claude-3-5-haiku-20241022");
      expect(config.maxDiffLines).toBe(500);
      expect(config.language).toBe("english");
      expect(config.includeScope).toBe(true);
      expect(config.temperature).toBe(0.3);
      expect(config.apiKey).toBe("");
    });

    it("should load config from file when it exists", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(
        JSON.stringify({
          apiKey: "sk-test-key",
          model: "claude-3-opus-20240229",
          maxDiffLines: 1000,
          language: "spanish",
          includeScope: false,
          temperature: 0.5,
        })
      );

      const config = loadConfig();

      expect(config.apiKey).toBe("sk-test-key");
      expect(config.model).toBe("claude-3-opus-20240229");
      expect(config.maxDiffLines).toBe(1000);
      expect(config.language).toBe("spanish");
      expect(config.includeScope).toBe(false);
      expect(config.temperature).toBe(0.5);
    });

    it("should fallback to ANTHROPIC_API_KEY env var", () => {
      mockFs.existsSync.mockReturnValue(false);
      process.env.ANTHROPIC_API_KEY = "sk-env-key";

      const config = loadConfig();

      expect(config.apiKey).toBe("sk-env-key");
    });

    it("should prefer file apiKey over env var", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ apiKey: "sk-file-key" }));
      process.env.ANTHROPIC_API_KEY = "sk-env-key";

      const config = loadConfig();

      expect(config.apiKey).toBe("sk-file-key");
    });

    it("should handle malformed config file gracefully", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue("not valid json{{{");

      const config = loadConfig();

      expect(config.model).toBe("claude-3-5-haiku-20241022");
      expect(config.apiKey).toBe("");
    });

    it("should merge partial config with defaults", () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ language: "french" }));

      const config = loadConfig();

      expect(config.language).toBe("french");
      expect(config.model).toBe("claude-3-5-haiku-20241022");
      expect(config.maxDiffLines).toBe(500);
    });
  });

  describe("saveConfig", () => {
    it("should write config to the correct path", () => {
      mockFs.existsSync.mockReturnValue(false);

      saveConfig({ apiKey: "sk-new-key", language: "german" });

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        path.join(MOCK_HOMEDIR, ".smartcommitrc.json"),
        expect.any(String),
        "utf-8"
      );

      const writtenData = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
      expect(writtenData.apiKey).toBe("sk-new-key");
      expect(writtenData.language).toBe("german");
    });
  });

  describe("validateApiKey", () => {
    it("should return true when API key is present", () => {
      const result = validateApiKey({
        apiKey: "sk-test",
        model: "",
        maxDiffLines: 500,
        language: "english",
        includeScope: true,
        temperature: 0.3,
      });

      expect(result).toBe(true);
    });

    it("should return false when API key is empty", () => {
      const result = validateApiKey({
        apiKey: "",
        model: "",
        maxDiffLines: 500,
        language: "english",
        includeScope: true,
        temperature: 0.3,
      });

      expect(result).toBe(false);
    });
  });

  describe("getConfigPath", () => {
    it("should return path in home directory", () => {
      const configPath = getConfigPath();

      expect(configPath).toBe(path.join(MOCK_HOMEDIR, ".smartcommitrc.json"));
    });
  });
});
