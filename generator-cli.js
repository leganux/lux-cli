#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility to ensure directory exists
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Format TypeScript code with proper syntax
const formatTS = (code) => {
    // Split code into lines for initial processing
    let lines = code.split('\n');
    
    // Format imports
    lines = lines.map(line => {
        if (line.trim().startsWith('import')) {
            const parts = line.match(/import\s*{([^}]+)}\s*from\s*(['"][^'"]+['"])/);
            if (parts) {
                const imports = parts[1].split(',').map(i => i.trim()).join(', ');
                return `import { ${imports} } from ${parts[2]};`;
            }
        }
        return line;
    });

    // Format interface properties
    let inInterface = false;
    lines = lines.map((line, i, arr) => {
        if (line.includes('interface') && line.includes('extends')) {
            inInterface = true;
            return line;
        }
        if (inInterface) {
            if (line.includes('}')) {
                inInterface = false;
                return line;
            }
            if (line.trim() && !line.includes('}')) {
                const nextLine = arr[i + 1];
                if (nextLine && !nextLine.includes('}')) {
                    return line.endsWith(',') ? line : `${line},`;
                }
            }
        }
        return line;
    });

    // Format mongoose schema
    let inSchema = false;
    lines = lines.map((line, i, arr) => {
        if (line.includes('new Schema({')) {
            inSchema = true;
            return line;
        }
        if (line.includes('timestamps: true')) {
            inSchema = false;
            return line;
        }
        if (inSchema && line.trim()) {
            if (line.includes('type:')) {
                return line.endsWith(',') ? line : `${line},`;
            }
            if (line.includes('required:')) {
                return line.endsWith(',') ? line : `${line},`;
            }
            if (line.includes('ref:')) {
                return line.endsWith(',') ? line : `${line},`;
            }
            if (line.includes('enum:')) {
                if (line.includes('[') && line.includes(']')) {
                    const enumMatch = line.match(/\[(.*)\]/);
                    if (enumMatch) {
                        const enumValues = enumMatch[1]
                            .split(/\s+/)
                            .filter(v => v.startsWith('"') && v.endsWith('"'))
                            .join(', ');
                        return line.replace(/\[.*\]/, `[${enumValues}],`);
                    }
                }
                return line.endsWith(',') ? line : `${line},`;
            }
        }
        return line;
    });

    // Format object literals
    let inObject = false;
    lines = lines.map((line, i, arr) => {
        if (line.includes('= {')) {
            inObject = true;
            return line;
        }
        if (line.includes('};')) {
            inObject = false;
            return line;
        }
        if (inObject && line.trim() && !line.includes('};')) {
            const nextLine = arr[i + 1];
            if (nextLine && !nextLine.includes('};')) {
                return line.endsWith(',') ? line : `${line},`;
            }
        }
        return line;
    });

    return lines.join('\n');
};

// Generate model content
const generateModel = (config) => {
    let schemaFields = '';
    for (const [key, type] of Object.entries(config.schema)) {
        // Skip createdAt and updatedAt as they're handled by timestamps
        if (key === 'createdAt' || key === 'updatedAt') continue;

        let mongooseType = 'String';
        let extraProps = '';
        
        switch (type) {
            case 'string':
                mongooseType = 'String';
                break;
            case 'number':
                mongooseType = 'Number';
                break;
            case 'boolean':
                mongooseType = 'Boolean';
                break;
            case 'enum':
                mongooseType = 'String';
                const enumValues = config.ui[key].options?.map(opt => `"${opt}"`).join(', ');
                extraProps = `\n    enum: [${enumValues}],`;
                break;
            default:
                if (type.startsWith('relationship:')) {
                    const [_, relatedModel] = type.split(':');
                    mongooseType = 'Schema.Types.ObjectId';
                    extraProps = `\n    ref: '${relatedModel}',`;
                }
        }

        const required = config.ui[key]?.required;
        schemaFields += `  ${key}: {\n    type: ${mongooseType},${extraProps}${required ? `\n    required: [true, '${key} is required'],` : ''}\n  },\n`;
    }

    return formatTS(`import mongoose, { Document, Schema } from 'mongoose';

export interface I${config.Name} extends Document {
${Object.entries(config.schema)
    .filter(([key]) => key !== 'createdAt' && key !== 'updatedAt')
    .map(([key, type]) => {
        let tsType = 'string';
        if (type === 'number') tsType = 'number';
        else if (type === 'boolean') tsType = 'boolean';
        else if (type.startsWith('relationship:')) {
            const [_, relatedModel] = type.split(':');
            tsType = `mongoose.Types.ObjectId | string`;
        }
        return `  ${key}: ${tsType}`;
    }).join(',\n')}
  createdAt: Date,
  updatedAt: Date
}

const ${config.name}Schema = new Schema({
${schemaFields}}, {
  timestamps: true
});

export const ${config.Name}Model = mongoose.model<I${config.Name}>('${config.Name}', ${config.name}Schema);
`);
};

// Generate controller content
const generateController = (config) => {
    return formatTS(`import { Request, Response } from 'express';
import { ${config.Name}Model, I${config.Name} } from './model';

interface ApiError {
  message: string,
  [key: string]: any
}

export class ${config.Name}Controller {
  // Add custom controller methods here
}
`);
};

// Generate routes content
const generateRoutes = (config) => {
    const routesContent = `import { Router } from 'express';
import { ${config.Name}Model } from './model';
import { ApiatoNoSQL } from '../../libs/apiato/no-sql/apiato';
import { validateFirebaseToken, roleGuard } from '../../middleware/auth.middleware';
import { UserRole } from '../../types/user';
import { ${config.Name}Controller } from './controller';

const router = Router();
const apiato = new ApiatoNoSQL();

// Apply authentication middleware to all routes
router.use(validateFirebaseToken);

// Empty validation and population objects
const ${config.name}Validation = {};
const populationObject = {};

// Create datatable method
router.post('/datatable', roleGuard([UserRole.ADMIN]), apiato.datatable_aggregate(${config.Name}Model, [], '', { allowDiskUse: true, search_by_field: true }));

// Get all with pagination
router.get('/', apiato.getMany(${config.Name}Model, populationObject));

// Get one by ID
router.get('/:id', apiato.getOneById(${config.Name}Model, populationObject));

// Create new
router.post('/', roleGuard([UserRole.ADMIN]), apiato.createOne(${config.Name}Model, ${config.name}Validation, populationObject, { customValidationCode: 400 }));

// Update by ID
router.put('/:id', roleGuard([UserRole.ADMIN]), apiato.updateById(${config.Name}Model, ${config.name}Validation, populationObject, { updateFieldName: 'updatedAt' }));

// Delete by ID
router.delete('/:id', roleGuard([UserRole.ADMIN]), apiato.findIdAndDelete(${config.Name}Model));

// Additional Apiato operations
router.post('/find-update-create', roleGuard([UserRole.ADMIN]), apiato.findUpdateOrCreate(${config.Name}Model, ${config.name}Validation, populationObject, { updateFieldName: 'updatedAt' }));

router.put('/find-update', roleGuard([UserRole.ADMIN]), apiato.findUpdate(${config.Name}Model, ${config.name}Validation, populationObject, { updateFieldName: 'updatedAt' }));

router.get('/where/first', roleGuard([UserRole.ADMIN]), apiato.getOneWhere(${config.Name}Model, populationObject));

export default router;`;

    return formatTS(routesContent);
};

// Generate swagger content
const generateSwagger = (config) => {
    const schemaProperties = Object.entries(config.schema)
        .filter(([key]) => key !== 'createdAt' && key !== 'updatedAt')
        .map(([key, type]) => {
            let swaggerType = 'string';
            let format = undefined;
            let additionalProps = {};

            switch (type) {
                case 'number':
                    swaggerType = 'number';
                    break;
                case 'boolean':
                    swaggerType = 'boolean';
                    break;
                case 'enum':
                    swaggerType = 'string';
                    additionalProps.enum = config.ui[key].options || [];
                    break;
                default:
                    if (type.startsWith('relationship:')) {
                        swaggerType = 'string';
                        format = 'objectId';
                    }
            }

            return `        ${key}: {
          type: '${swaggerType}'${format ? `,\n          format: '${format}'` : ''}${additionalProps.enum ? `,\n          enum: ${JSON.stringify(additionalProps.enum)}` : ''}
        }`;
        }).join(',\n');

    return `/**
 * @swagger
 * components:
 *   schemas:
 *     ${config.Name}:
 *       type: object
 *       required:
 *         ${Object.entries(config.ui)
              .filter(([key, field]) => field.required && key !== 'createdAt' && key !== 'updatedAt')
              .map(([key]) => `- ${key}`)
              .join('\n         ')}
 *       properties:
 *         _id:
 *           type: string
 *           format: objectId
 *           description: Auto-generated MongoDB ID
 *         ${schemaProperties}
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /${config.path}:
 *   get:
 *     summary: Get all ${config.namePlural}
 *     tags: [${config.NamePlural}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of ${config.namePlural}
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/${config.Name}'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */

/**
 * @swagger
 * /${config.path}/{id}:
 *   get:
 *     summary: Get a ${config.name} by ID
 *     tags: [${config.NamePlural}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The ${config.name}
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/${config.Name}'
 *       404:
 *         description: ${config.Name} not found
 */

/**
 * @swagger
 * /${config.path}:
 *   post:
 *     summary: Create a new ${config.name}
 *     tags: [${config.NamePlural}]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/${config.Name}'
 *     responses:
 *       201:
 *         description: The created ${config.name}
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/${config.Name}'
 */

/**
 * @swagger
 * /${config.path}/{id}:
 *   put:
 *     summary: Update a ${config.name}
 *     tags: [${config.NamePlural}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/${config.Name}'
 *     responses:
 *       200:
 *         description: The updated ${config.name}
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/${config.Name}'
 *       404:
 *         description: ${config.Name} not found
 */

/**
 * @swagger
 * /${config.path}/{id}:
 *   delete:
 *     summary: Delete a ${config.name}
 *     tags: [${config.NamePlural}]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: ${config.Name} deleted successfully
 *       404:
 *         description: ${config.Name} not found
 */
`;
};

// Main function to generate module
const generateModule = async (jsonPath) => {
    try {
        // Read and parse JSON file
        const configContent = fs.readFileSync(jsonPath, 'utf8');
        const config = JSON.parse(configContent);

        // Base directory for the new module
        const baseDir = path.join(process.cwd(), 'src/modules', config.name);
        
        // Create necessary directory
        ensureDirectoryExists(baseDir);

        // Generate files
        const files = [
            {
                path: path.join(baseDir, 'model.ts'),
                content: generateModel(config),
            },
            {
                path: path.join(baseDir, 'controller.ts'),
                content: generateController(config),
            },
            {
                path: path.join(baseDir, 'routes.ts'),
                content: generateRoutes(config),
            },
            {
                path: path.join(baseDir, 'swagger.ts'),
                content: generateSwagger(config),
            },
        ];

        // Write all files
        for (const file of files) {
            const dirPath = path.dirname(file.path);
            ensureDirectoryExists(dirPath);
            fs.writeFileSync(file.path, file.content);
            console.log(`Generated: ${file.path}`);
        }

        console.log(`\nModule ${config.name} generated successfully!`);
    } catch (error) {
        console.error('Error generating module:', error);
        process.exit(1);
    }
};

// Main execution
let jsonPath;

// Check if path is provided as command line argument
if (process.argv.length > 2) {
    jsonPath = process.argv[2];
} else {
    // If not, ask interactively
    const readline = (await import('readline')).createInterface({
        input: process.stdin,
        output: process.stdout
    });

    jsonPath = await new Promise((resolve) => {
        readline.question('Please provide the path to your JSON schema file: ', (answer) => {
            readline.close();
            resolve(answer);
        });
    });
}

if (!jsonPath) {
    console.error('Please provide the path to your JSON schema file as an argument');
    console.error('Example: node scripts/generator-cli.js ./moduleSchemaExample/newModule.runner.json');
    process.exit(1);
}

// Convert to absolute path if relative
jsonPath = path.resolve(process.cwd(), jsonPath);

generateModule(jsonPath).catch(console.error);
