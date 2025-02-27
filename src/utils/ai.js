import OpenAI from 'openai';
import chalk from 'chalk';
import { getConfig } from './config.js';

export async function createAIClient() {
  const config = await getConfig();
  
  if (config.aiProvider === 'openai') {
    return new OpenAI({
      apiKey: config.openaiApiKey
    });
  } else {
    // For Deepseek, we'll use fetch API directly since there's no official SDK
    return {
      async chat(prompt) {
        try {
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
        } catch (error) {
          console.error(chalk.red('Error calling Deepseek API:'), error);
          throw error;
        }
      }
    };
  }
}

export async function generateModulesList(systemDescription) {
  const aiClient = await createAIClient();
  const prompt = `
    As a system architect, analyze the following system description and provide a list of necessary database tables/modules.
    Try to imagine the system and its requirements and generate a list of tables/modules that are needed to implement the system, include tables that are not mentioned in the description but are necessary for the system to work properly.
    Return only the list of tables in a JSON array format with each table name in English and in singular form.
    System description: ${systemDescription}
    
    Example response format:
    ["user", "product", "category"]

    
  `;

  try {
    let response;
    if (aiClient instanceof OpenAI) {
      const completion = await aiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      response = completion.choices[0].message.content;
    } else {
      response = await aiClient.chat(prompt);
    }

    return JSON.parse(response);
  } catch (error) {
    console.error(chalk.red('Error generating modules list:'), error);
    throw error;
  }
}

export async function generateModuleRunner(moduleName, systemDescription) {
  const aiClient = await createAIClient();
  const prompt = `
    Generate a module runner JSON configuration for a "${moduleName}" module based on this system description:
    ${systemDescription}

    Follow this exact structure but with appropriate fields for ${moduleName}:
    {
      "version": "0.0.0",
      "name": "module_name",
      "namePlural": "module_names",
      "NamePlural": "ModuleNames",
      "Name": "ModuleName",
      "path": "module_path",
      "schema": {
        // Define appropriate fields with types: string, number, boolean, enum, relationship:<entity>:type
      },
      "ui": {
        // For each schema field, define UI properties:
        // type (text, number, textarea, picture, relationship-single, relationship-multiple, enum, boolean)
        // label, placeholder, required, api-ref (for relationships), options (for enums)
      }
    }


    Example of reponse format :

    {
    "version": "0.0.0",
    "name": "product",
    "namePlural": "products",
    "NamePlural": "Products",
    "Name": "Product",
    "path": "product",
    "schema": {
        "price": "number",
        "description": "string",
        "image": "string",
        "category": "relationship:category:array",
        "stock": "number",
        "rating": "number",
        "numReviews": "number",
        "countInStock": "number",
        "brand": "relationship:brand:single",
        "type": "enum",
        "active": "boolean",
        "createdAt": "string",
        "updatedAt": "string"
    },
    "ui": {
        "name": {
            "type": "text",
            "label": "Name",
            "placeholder": "Enter name",
            "required": true
        },
        "price": {
            "type": "number",
            "label": "Price",
            "placeholder": "Enter price",
            "required": true
        },
        "description": {
            "type": "textarea",
            "label": "Description",
            "placeholder": "Enter description",
            "required": true
        },
        "image": {
            "type": "picture",
            "label": "Image",
            "placeholder": "Enter image",
            "required": true
        },
        "category": {
            "type": "relationship-multiple",
            "label": "Categories",
            "placeholder": "Enter category",
            "api-ref": "category",
            "required": false
        },
        "stock": {
            "type": "number",
            "label": "Stock",
            "placeholder": "Enter stock",
            "required": true
        },
        "rating": {
            "type": "number",
            "label": "Rating",
            "placeholder": "Enter rating",
            "required": true
        },
        "numReviews": {
            "type": "number",
            "label": "NumReviews",
            "placeholder": "Enter numReviews",
            "required": true
        },
        "countInStock": {
            "type": "number",
            "label": "CountInStock",
            "placeholder": "Enter countInStock",
            "required": true
        },
        "brand": {
            "type": "relationship-single",
            "label": "Brand",
            "placeholder": "Enter brand",
            "api-ref": "brand",
            "required": false
        },
        "createdAt": {
            "type": "text",
            "label": "CreatedAt",
            "placeholder": "Enter createdAt",
            "required": true
        },
        "updatedAt": {
            "type": "text",
            "label": "UpdatedAt",
            "placeholder": "Enter updatedAt",
            "required": true
        },
        "type": {
            "type": "enum",
            "label": "Type",
            "placeholder": "Select type",
            "options": [
                "type1",
                "type2",
                "type3"
            ],
            "required": false
        },
        "active": {
            "type": "boolean",
            "label": "Active",
            "required": true
        }
    }
}

  `;

  try {
    let response;
    if (aiClient instanceof OpenAI) {
      const completion = await aiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      response = completion.choices[0].message.content;
    } else {
      response = await aiClient.chat(prompt);
    }

    return JSON.parse(response);
  } catch (error) {
    console.error(chalk.red('Error generating module runner:'), error);
    throw error;
  }
}
