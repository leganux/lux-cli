import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import chalk from 'chalk';

const CONFIG_DIR = join(homedir(), '.lux');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export const defaultConfig = {
  aiProvider: 'openai', // or 'deepseek'
  openaiApiKey: '',
  deepseekApiKey: '',
};

export async function ensureConfigExists() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    try {
      await fs.access(CONFIG_FILE);
    } catch {
      await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }
  } catch (error) {
    console.error(chalk.red('Error ensuring config exists:'), error);
    throw error;
  }
}

export async function getConfig() {
  try {
    await ensureConfigExists();
    const configData = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(chalk.red('Error reading config:'), error);
    throw error;
  }
}

export async function updateConfig(newConfig) {
  try {
    await ensureConfigExists();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
  } catch (error) {
    console.error(chalk.red('Error updating config:'), error);
    throw error;
  }
}
