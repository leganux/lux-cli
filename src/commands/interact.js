import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import fetch from 'node-fetch';

const CONFIG_FILE = join(homedir(), '.lux', 'config.json');

async function getConfig() {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(chalk.red('Error reading config:'), error);
    throw new Error('Please run "lux configure" first to set up your AI provider');
  }
}

async function callAI(prompt, model = 'gpt-4') {
  const config = await getConfig();
  
  try {
    if (config.aiProvider === 'openai') {
      const openai = new OpenAI({
        apiKey: config.openaiApiKey
      });
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      return response.choices[0].message.content;
    } else {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error(chalk.red('Error calling AI API:'), error);
    throw error;
  }
}

async function modifyFile(filePath, description, content) {
  const prompt = `
Please modify the following file content according to this description:
${description}

Current file content:
${content}

Requirements:
1. Return ONLY the modified file content, without any explanations or markdown
2. Preserve the overall structure and style of the file
3. Make only the requested changes
4. Ensure the code remains functional
5. Keep existing imports and dependencies

Return only the modified file content:
`;

  try {
    return await callAI(prompt);
  } catch (error) {
    console.error(chalk.red('Error modifying file:'), error);
    throw error;
  }
}

export async function interact() {
  console.log(chalk.cyan('\n🔄 Interactive File Modifier\n'));

  try {
    while (true) {
      const { filePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'filePath',
          message: 'Enter the full path of the file to modify (or "exit" to quit):',
          validate: (input) => {
            if (input.toLowerCase() === 'exit') return true;
            if (input.trim() === '') return 'File path is required';
            return true;
          }
        }
      ]);

      if (filePath.toLowerCase() === 'exit') {
        console.log(chalk.green('\n👋 Goodbye!'));
        break;
      }

      // Verify file exists
      const spinner = ora('Verifying file...').start();
      try {
        await fs.access(filePath);
        spinner.succeed('File found');
      } catch (error) {
        spinner.fail('File not found');
        console.error(chalk.red(`Error: File not found at ${filePath}`));
        continue;
      }

      // Get file content
      const fileContent = await fs.readFile(filePath, 'utf8');

      const { description } = await inquirer.prompt([
        {
          type: 'input',
          name: 'description',
          message: 'Describe the changes you want to make:',
          validate: (input) => input.trim() !== '' || 'Description is required'
        }
      ]);

      // Generate modifications
      spinner.start('Generating modifications...');
      const modifiedContent = await modifyFile(filePath, description, fileContent);
      spinner.succeed('Modifications generated');

      // Write changes
      spinner.start('Applying changes...');
      await fs.writeFile(filePath, modifiedContent);
      spinner.succeed('Changes applied successfully');

      console.log(chalk.green('\n✨ File modified successfully!'));
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}
