import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import axios from 'axios';
import extract from 'extract-zip';
import chalk from 'chalk';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function checkGitInstalled() {
  try {
    await execAsync('git --version');
    return true;
  } catch {
    return false;
  }
}

export async function downloadAndExtract(url, destPath, isZip = true) {
  try {
    if (isZip) {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const tempZipPath = join(destPath, 'temp.zip');
      
      await fs.writeFile(tempZipPath, response.data);
      await extract(tempZipPath, { dir: destPath });
      await fs.unlink(tempZipPath);
      
      // Move files from the extracted directory to the destination
      const extractedDir = join(destPath, url.split('/').pop().replace('.zip', ''));
      const files = await fs.readdir(extractedDir);
      
      for (const file of files) {
        await fs.rename(join(extractedDir, file), join(destPath, file));
      }
      
      await fs.rmdir(extractedDir);
    } else {
      // Clone repository using Git
      await execAsync(`git clone ${url} "${destPath}"`);
      // Remove .git directory
      await fs.rm(join(destPath, '.git'), { recursive: true, force: true });
    }
  } catch (error) {
    console.error(chalk.red('Error downloading/extracting project:'), error);
    throw error;
  }
}

export async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export async function saveModuleRunner(config, outputDir = 'generated_runners') {
  try {
    const fileName = `${config.name}.runner.json`;
    const dirPath = resolve(process.cwd(), outputDir);
    
    await ensureDirectoryExists(dirPath);
    
    const filePath = join(dirPath, fileName);
    await fs.writeFile(filePath, JSON.stringify(config, null, 2));
    
    return filePath;
  } catch (error) {
    console.error(chalk.red('Error saving module runner:'), error);
    throw error;
  }
}

export async function checkModuleExists(modulePath) {
  try {
    await fs.access(modulePath);
    return true;
  } catch {
    return false;
  }
}

export async function executeGeneratorScript(scriptPath, jsonPath, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const proc = spawn('node', [scriptPath], {
        stdio: ['pipe', 'inherit', 'inherit'],
        ...options
      });

      // Write the JSON path to stdin
      proc.stdin.write(jsonPath + '\n');
      proc.stdin.end();

      // Handle process completion
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Generator script exited with code ${code}`));
        }
      });

      // Handle process errors
      proc.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function moveDirectory(source, destination) {
  try {
    await ensureDirectoryExists(destination);
    await fs.rename(source, destination);
  } catch (error) {
    console.error(chalk.red('Error moving directory:'), error);
    throw error;
  }
}

export async function copyDirectory(source, destination) {
  try {
    await ensureDirectoryExists(destination);
    
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = join(source, entry.name);
      const destPath = join(destination, entry.name);
      
      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    console.error(chalk.red('Error copying directory:'), error);
    throw error;
  }
}
