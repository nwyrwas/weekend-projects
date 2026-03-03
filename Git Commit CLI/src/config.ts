import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/** Configuration options for smart-commit */
export interface SmartCommitConfig {
  /** Anthropic API key */
  apiKey: string;
  /** Claude model to use */
  model: string;
  /** Maximum number of diff lines to send to the API */
  maxDiffLines: number;
  /** Language for the commit message */
  language: string;
  /** Whether to include scope in commit messages */
  includeScope: boolean;
  /** Temperature for the AI model */
  temperature: number;
}

/** Default configuration values */
const DEFAULT_CONFIG: Omit<SmartCommitConfig, "apiKey"> = {
  model: "claude-3-5-haiku-20241022",
  maxDiffLines: 500,
  language: "english",
  includeScope: true,
  temperature: 0.3,
};

/** Path to the config file in the user's home directory */
const CONFIG_FILE_PATH = path.join(os.homedir(), ".smartcommitrc.json");

/**
 * Loads the configuration from the .smartcommitrc.json file and environment variables.
 * Environment variable ANTHROPIC_API_KEY is used as a fallback for the API key.
 * @returns The merged configuration object
 */
export function loadConfig(): SmartCommitConfig {
  let fileConfig: Partial<SmartCommitConfig> = {};

  if (fs.existsSync(CONFIG_FILE_PATH)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
      fileConfig = JSON.parse(raw) as Partial<SmartCommitConfig>;
    } catch {
      // If config file is malformed, use defaults
    }
  }

  const apiKey = fileConfig.apiKey || process.env.ANTHROPIC_API_KEY || "";

  return {
    apiKey,
    model: fileConfig.model || DEFAULT_CONFIG.model,
    maxDiffLines: fileConfig.maxDiffLines || DEFAULT_CONFIG.maxDiffLines,
    language: fileConfig.language || DEFAULT_CONFIG.language,
    includeScope:
      fileConfig.includeScope !== undefined ? fileConfig.includeScope : DEFAULT_CONFIG.includeScope,
    temperature: fileConfig.temperature ?? DEFAULT_CONFIG.temperature,
  };
}

/**
 * Saves the configuration to the .smartcommitrc.json file.
 * @param config - The configuration object to save
 */
export function saveConfig(config: Partial<SmartCommitConfig>): void {
  const existing = loadConfig();
  const merged = { ...existing, ...config };

  // Remove apiKey from saved config if it matches env var (don't persist env-sourced keys)
  const toSave: Partial<SmartCommitConfig> = { ...merged };

  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(toSave, null, 2), "utf-8");
}

/**
 * Returns the path to the config file.
 * @returns The absolute path to .smartcommitrc.json
 */
export function getConfigPath(): string {
  return CONFIG_FILE_PATH;
}

/**
 * Validates that the API key is present in the configuration.
 * @param config - The configuration to validate
 * @returns True if the API key is set
 */
export function validateApiKey(config: SmartCommitConfig): boolean {
  return config.apiKey.length > 0;
}
