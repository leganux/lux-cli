function generateCheckboxHandler(schema) {
    return `const handleCheckbox = async (id: string, field: string, isChecked: boolean) => {
  try {
    const updateData: Partial<${schema.Name}> = {
      [field]: isChecked
    }
    await ${schema.name}Service.update${schema.Name}(id, updateData)
    refreshTable()
  } catch (error) {
    console.error('Error updating ${schema.name}:', error)
  }
}`;
}

function generateFormField(schema, key, field, type) {
    if (type.startsWith('relationship:')) {
        const [_, ref, format] = type.split(':');
        const isMultiple = format === 'array';
        const Type = ref.charAt(0).toUpperCase() + ref.slice(1);
        const types = isMultiple ? `${ref}s` : ref;
        return `              <div class="mb-3">
                <label class="form-label">${field.label}</label>
                <select class="form-select" v-model="${schema.name}Form.${key}"${isMultiple ? ' multiple' : ''}${field.required ? ' required' : ''}>
                  <option value="">Select ${field.label}</option>
                  <option v-for="${ref} in ${ref}Store.${ref}s" :key="${ref}._id" :value="${ref}">{{ ${ref}.name }}</option>
                </select>
                ${isMultiple ? '<small class="text-muted">Hold Ctrl/Cmd to select multiple items</small>' : ''}
              </div>`;
    }
    
    if (field.type === 'enum' && field.options) {
        return `              <div class="mb-3">
                <label class="form-label">${field.label}</label>
                <select class="form-select" v-model="${schema.name}Form.${key}"${field.required ? ' required' : ''}>
                  ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('\n                  ')}
                </select>
              </div>`;
    }
    
    if (field.type === 'boolean') {
        return `              <div class="mb-3">
                <div class="form-check">
                  <input type="checkbox" class="form-check-input" v-model="${schema.name}Form.${key}" id="${key}">
                  <label class="form-check-label" for="${key}">${field.label}</label>
                </div>
              </div>`;
    }

    if (field.type === 'textarea') {
        return `              <div class="mb-3">
                <label class="form-label">${field.label}</label>
                <textarea class="form-control" v-model="${schema.name}Form.${key}" placeholder="${field.placeholder}"${field.required ? ' required' : ''}></textarea>
              </div>`;
    }

    const inputType = field.type === 'number' ? 'number' : 'text';
    return `              <div class="mb-3">
                <label class="form-label">${field.label}</label>
                <input type="${inputType}" class="form-control" v-model="${schema.name}Form.${key}" placeholder="${field.placeholder}"${field.required ? ' required' : ''}>
              </div>`;
}

function generateFormFields(schema) {
    return Object.entries(schema.ui)
        .filter(([key]) => !['createdAt', 'updatedAt'].includes(key))
        .map(([key, field]) => generateFormField(schema, key, field, schema.schema[key]))
        .join('\n\n');
}

function generateInterface(schema) {
    const fields = Object.entries(schema.schema).map(([key, type]) => {
        let tsType = 'string';
        if (type === 'number') tsType = 'number';
        if (type === 'boolean') tsType = 'boolean';
        if (type.startsWith('relationship')) {
            const [_, ref, format] = type.split(':');
            // Capitalize the first letter of the relationship type
            const capitalizedRef = ref.charAt(0).toUpperCase() + ref.slice(1);
            tsType = format === 'array' ? `${capitalizedRef}[]` : capitalizedRef;
        }
        return `  ${key}: ${tsType};`;
    }).join('\n');

    const createDtoFields = Object.entries(schema.schema)
        .filter(([key]) => !['createdAt', 'updatedAt'].includes(key))
        .map(([key, type]) => {
            let tsType = 'string';
            if (type === 'number') tsType = 'number';
            if (type === 'boolean') tsType = 'boolean';
            if (type.startsWith('relationship')) {
                const [_, ref, format] = type.split(':');
                // Capitalize the first letter of the relationship type
                const capitalizedRef = ref.charAt(0).toUpperCase() + ref.slice(1);
                tsType = format === 'array' ? `${capitalizedRef}[]` : capitalizedRef;
            }
            const optional = !schema.ui[key]?.required;
            return `  ${key}${optional ? '?' : ''}: ${tsType};`;
        }).join('\n');

    // Find all relationship types
    const relationships = new Set();
    Object.entries(schema.schema).forEach(([_, type]) => {
        if (type.startsWith('relationship:')) {
            const [_, ref] = type.split(':');
            // Capitalize the first letter of the relationship type
            const capitalizedRef = ref.charAt(0).toUpperCase() + ref.slice(1);
            relationships.add(capitalizedRef);
        }
    });

    // Generate relationship interfaces
    const relationshipInterfaces = Array.from(relationships).map(type => `
export interface ${type} {
  _id: string;
  name: string;
  description?: string;
}`).join('\n');

    return `${relationshipInterfaces}

export interface ${schema.Name} {
  _id: string;
${fields}
}

export interface Create${schema.Name}Dto {
${createDtoFields}
}

export interface Update${schema.Name}Dto {
${createDtoFields.replace(/;/g, '?;')}
}`;
}

function generateService(schema) {
    return `import type { ${schema.Name}, Create${schema.Name}Dto, Update${schema.Name}Dto } from '../interfaces/${schema.name}.interface'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const use${schema.Name}Service = () => {
  const get${schema.NamePlural} = async (): Promise<${schema.Name}[]> => {
    const response = await axios.get(\`\${API_URL}/${schema.namePlural}\`, {
      headers: {
        Authorization: \`Bearer \${localStorage.getItem('idToken')}\`
      }
    })
    return response.data.data
  }

  const get${schema.Name}ById = async (id: string): Promise<${schema.Name}> => {
    const response = await axios.get(\`\${API_URL}/${schema.namePlural}/\${id}\`, {
      headers: {
        Authorization: \`Bearer \${localStorage.getItem('idToken')}\`
      }
    })
    return response.data.data
  }

  const create${schema.Name} = async (data: Create${schema.Name}Dto): Promise<${schema.Name}> => {
    const response = await axios.post(\`\${API_URL}/${schema.namePlural}\`, data, {
      headers: {
        Authorization: \`Bearer \${localStorage.getItem('idToken')}\`
      }
    })
    return response.data.data
  }

  const update${schema.Name} = async (id: string, data: Update${schema.Name}Dto): Promise<${schema.Name}> => {
    const response = await axios.put(\`\${API_URL}/${schema.namePlural}/\${id}\`, data, {
      headers: {
        Authorization: \`Bearer \${localStorage.getItem('idToken')}\`
      }
    })
    return response.data.data
  }

  const delete${schema.Name} = async (id: string): Promise<void> => {
    await axios.delete(\`\${API_URL}/${schema.namePlural}/\${id}\`, {
      headers: {
        Authorization: \`Bearer \${localStorage.getItem('idToken')}\`
      }
    })
  }

  const updateField = async (id: string, field: string, value: any): Promise<${schema.Name}> => {
    const updateData = {
      [field]: value
    }
    const response = await axios.put(\`\${API_URL}/${schema.namePlural}/\${id}\`, updateData, {
      headers: {
        Authorization: \`Bearer \${localStorage.getItem('idToken')}\`
      }
    })
    return response.data.data
  }

  return {
    get${schema.NamePlural},
    get${schema.Name}ById,
    create${schema.Name},
    update${schema.Name},
    delete${schema.Name},
    updateField
  }
}`;
}

function generateStore(schema) {
    // Find all relationship types
    const relationships = new Set();
    Object.entries(schema.schema).forEach(([_, type]) => {
        if (type.startsWith('relationship:')) {
            const [_, ref] = type.split(':');
            // Capitalize the first letter of the relationship type
            const capitalizedRef = ref.charAt(0).toUpperCase() + ref.slice(1);
            relationships.add(capitalizedRef);
        }
    });

    // Import relationship stores
    const relationshipImports = Array.from(relationships).map(type => 
        `import { use${type}Store } from './${type.toLowerCase()}.store'`
    ).join('\n');

    // Initialize relationship stores
    const relationshipStores = Array.from(relationships).map(type => {
        const ref = type.toLowerCase();
        return `const ${ref}Store = use${type}Store()`;
    }).join('\n  ');

    // Fetch relationship data
    const relationshipFetches = Array.from(relationships).map(type => {
        const ref = type.toLowerCase();
        return `${ref}Store.fetch${type}s()`;
    }).join(',\n      ');

    return `import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ${schema.Name}, Create${schema.Name}Dto, Update${schema.Name}Dto } from '../interfaces/${schema.name}.interface'
import { use${schema.Name}Service } from '../services/${schema.name}.service'
${relationshipImports}

export const use${schema.Name}Store = defineStore('${schema.name}', () => {
  const ${schema.namePlural} = ref<${schema.Name}[]>([])
  const current${schema.Name} = ref<${schema.Name} | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const ${schema.name}Service = use${schema.Name}Service()
  ${relationshipStores}

  const fetch${schema.NamePlural} = async () => {
    loading.value = true
    error.value = null
    try {
      await Promise.all([
        ${schema.name}Service.get${schema.NamePlural}().then(data => {
          ${schema.namePlural}.value = data
        }),
      ${relationshipFetches}
      ])
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch ${schema.namePlural}'
    } finally {
      loading.value = false
    }
  }

  const fetch${schema.Name}ById = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      current${schema.Name}.value = await ${schema.name}Service.get${schema.Name}ById(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch ${schema.name}'
      current${schema.Name}.value = null
    } finally {
      loading.value = false
    }
  }

  const create${schema.Name} = async (data: Create${schema.Name}Dto) => {
    loading.value = true
    error.value = null
    try {
      const new${schema.Name} = await ${schema.name}Service.create${schema.Name}(data)
      ${schema.namePlural}.value.push(new${schema.Name})
      return new${schema.Name}
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create ${schema.name}'
      throw e
    } finally {
      loading.value = false
    }
  }

  const update${schema.Name} = async (id: string, data: Update${schema.Name}Dto) => {
    loading.value = true
    error.value = null
    try {
      const updated${schema.Name} = await ${schema.name}Service.update${schema.Name}(id, data)
      const index = ${schema.namePlural}.value.findIndex(item => item._id === id)
      if (index !== -1) {
        ${schema.namePlural}.value[index] = updated${schema.Name}
      }
      if (current${schema.Name}.value?._id === id) {
        current${schema.Name}.value = updated${schema.Name}
      }
      return updated${schema.Name}
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update ${schema.name}'
      throw e
    } finally {
      loading.value = false
    }
  }

  const delete${schema.Name} = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await ${schema.name}Service.delete${schema.Name}(id)
      ${schema.namePlural}.value = ${schema.namePlural}.value.filter(item => item._id !== id)
      if (current${schema.Name}.value?._id === id) {
        current${schema.Name}.value = null
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete ${schema.name}'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    ${schema.namePlural},
    current${schema.Name},
    loading,
    error,
    fetch${schema.NamePlural},
    fetch${schema.Name}ById,
    create${schema.Name},
    update${schema.Name},
    delete${schema.Name}
  }
})`;
}

function generateConfig(schema) {
    return `import type { RouteRecordRaw } from 'vue-router'

const UI_FRAMEWORK = import.meta.env.VITE_UI_FRAMEWORK || 'bootstrap'

export interface MicroFrontendConfig {
    name: string
    routes: RouteRecordRaw[]
    layout?: string
    menu?: string
    type?: string
    navItem?: {
        label: string
        order?: number
        icon?: string
    }
}

export const config: MicroFrontendConfig = {
    name: '${schema.NamePlural} Management',
    layout: 'DashboardLayout',
    type: 'dashboard',
    navItem: {
        label: '${schema.NamePlural}',
        order: 1,
        icon: 'list'
    },
    routes: [
        {
            path: '/${schema.namePlural}',
            name: '${schema.namePlural}',
            component: UI_FRAMEWORK === 'bootstrap'
                ? /* @vite-ignore */ () => import('./views/${schema.Name}Bootstrap.vue')
                : /* @vite-ignore */ () => import('./views/${schema.Name}Fomantic.vue'),
            meta: {
                title: '${schema.NamePlural} List'
            }
        }
    ]
}`;
}

function generateTableColumns(schema) {
    return Object.entries(schema.ui)
        .map(([key, field]) => {
            const type = schema.schema[key];
            if (type.startsWith('relationship:')) {
                return `  {
    data: '${key}',
    title: '${field.label}',
    type: 'relationship',
    referenceName: 'name'
  }`;
            }
            
            let columnType = 'string';
            if (field.type === 'number') columnType = 'number';
            if (field.type === 'boolean') columnType = 'boolean';
            if (field.type === 'picture') columnType = 'picture';
            
            return `  {
    data: '${key}',
    title: '${field.label}',
    type: '${columnType}',
  }`;
        }).join(',\n');
}

function generateBootstrapView(schema) {
    // Find all relationship types
    const relationships = new Set();
    Object.entries(schema.schema).forEach(([_, type]) => {
        if (type.startsWith('relationship:')) {
            const [_, ref] = type.split(':');
            // Capitalize the first letter of the relationship type
            const capitalizedRef = ref.charAt(0).toUpperCase() + ref.slice(1);
            relationships.add(capitalizedRef);
        }
    });

    // Import relationship stores
    const relationshipImports = Array.from(relationships).map(type => 
        `import { use${type}Store } from '../stores/${type.toLowerCase()}.store'`
    ).join('\n');

    // Initialize relationship stores
    const relationshipStores = Array.from(relationships).map(type => {
        const ref = type.toLowerCase();
        return `const ${ref}Store = use${type}Store()`;
    }).join('\n');

    return `<template>
  <div class="${schema.name}-list">
    <!-- Page Header -->
    <div class="row mb-4">
      <div class="col-md-6">
        <h2>
          <i class="bi bi-list"></i>
          ${schema.NamePlural}
          <small class="text-muted d-block">Manage your ${schema.namePlural}</small>
        </h2>
      </div>

      <div class="col-md-6 text-end">
        <button class="btn btn-primary" @click="openCreateModal">
          <i class="bi bi-plus"></i>
          Create ${schema.Name}
        </button>
      </div>
    </div>

    <!-- ${schema.Name} Modal -->
    <div class="modal fade" ref="${schema.name}Modal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Edit ${schema.Name}' : 'Create ${schema.Name}' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
${generateFormFields(schema)}
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="handleSubmit">
              {{ isEditing ? 'Update' : 'Create' }}
              <i class="bi bi-check"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ${schema.NamePlural} Table -->
    <hr class="my-4">
    <datatable-component ref="datatableRef" v-if="columns.length"
      uri="/${schema.namePlural}/datatable" :columns="columns"
      @edit="handleEdit" @delete="handleDelete" @checkbox="handleCheckbox" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { TableColumn } from '../../../../types/datatable'
import type { Create${schema.Name}Dto, Update${schema.Name}Dto, ${schema.Name} } from '../interfaces/${schema.name}.interface'
import DatatableComponent from '@/components/dashboard/bootstrap/DatatableComponent.vue'
import { use${schema.Name}Service } from '../services/${schema.name}.service'
${relationshipImports}
// @ts-ignore - No type definitions available
import Swal from 'sweetalert2'
// @ts-ignore - No type definitions available
import { Modal } from 'bootstrap'

// Make the component available in template
const datatableComponent = DatatableComponent

const datatableRef = ref()
const ${schema.name}Modal = ref()
let modal: any = null
const ${schema.name}Service = use${schema.Name}Service()
${relationshipStores}
const isEditing = ref(false)
const editingId = ref('')

const ${schema.name}Form = ref<Create${schema.Name}Dto & Update${schema.Name}Dto>({
${Object.entries(schema.schema)
    .filter(([key]) => !['createdAt', 'updatedAt'].includes(key))
    .map(([key, type]) => {
        let defaultValue = '""';
        if (type === 'number') defaultValue = '0';
        if (type === 'boolean') defaultValue = 'false';
        if (type.startsWith('relationship')) {
            const [_, __, format] = type.split(':');
            defaultValue = format === 'array' ? '[]' : 'undefined';
        }
        return `  ${key}: ${defaultValue}`;
    }).join(',\n')}
})

const resetForm = () => {
  ${schema.name}Form.value = {
${Object.entries(schema.schema)
    .filter(([key]) => !['createdAt', 'updatedAt'].includes(key))
    .map(([key, type]) => {
        let defaultValue = '""';
        if (type === 'number') defaultValue = '0';
        if (type === 'boolean') defaultValue = 'false';
        if (type.startsWith('relationship')) {
            const [_, __, format] = type.split(':');
            defaultValue = format === 'array' ? '[]' : 'undefined';
        }
        return `    ${key}: ${defaultValue}`;
    }).join(',\n')}
  }
  isEditing.value = false
  editingId.value = ''
}

onMounted(() => {
  modal = new Modal(${schema.name}Modal.value)
})

const openCreateModal = () => {
  resetForm()
  modal.show()
}

const handleSubmit = async () => {
  try {
    if (isEditing.value) {
      const updateData: Update${schema.Name}Dto = {
${Object.entries(schema.schema)
    .filter(([key]) => !['createdAt', 'updatedAt'].includes(key))
    .map(([key]) => `        ${key}: ${schema.name}Form.value.${key}`).join(',\n')}
      }
      await ${schema.name}Service.update${schema.Name}(editingId.value, updateData)
    } else {
      const createData: Create${schema.Name}Dto = {
${Object.entries(schema.schema)
    .filter(([key]) => !['createdAt', 'updatedAt'].includes(key))
    .map(([key]) => `        ${key}: ${schema.name}Form.value.${key}`).join(',\n')}
      }
      await ${schema.name}Service.create${schema.Name}(createData)
    }
    modal.hide()
    resetForm()
    refreshTable()
  } catch (error) {
    console.error('Error saving ${schema.name}:', error)
  }
}

const refreshTable = () => {
  datatableRef.value?.forceRedraw()
}

const handleEdit = async (id: string) => {
  try {
    const data = await ${schema.name}Service.get${schema.Name}ById(id)
    ${schema.name}Form.value = {
${Object.entries(schema.schema)
    .filter(([key]) => !['createdAt', 'updatedAt'].includes(key))
    .map(([key]) => `      ${key}: data.${key}`).join(',\n')}
    }
    isEditing.value = true
    editingId.value = id
    modal.show()
  } catch (error) {
    console.error('Error fetching ${schema.name}:', error)
  }
}

const handleDelete = async (id: string) => {
  try {
    const result = await Swal.fire({
      title: "¿Seguro que desea eliminar?",
      text: "Esta acción no tiene retorno",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      confirmButtonColor: "#27b30d",
      cancelButtonText: "Cancelar",
      cancelButtonColor: "#dd1111",
      reverseButtons: true
    })

    if (result.isConfirmed) {
      await ${schema.name}Service.delete${schema.Name}(id)
      refreshTable()
    }
  } catch (error) {
    console.error('Error deleting ${schema.name}:', error)
  }
}

${generateCheckboxHandler(schema)}

const columns = ref<TableColumn[]>([
${generateTableColumns(schema)}
])
</script>

<style scoped>
.bi {
  font-size: 1.5em;
  vertical-align: middle;
  margin-right: 0.5rem;
}
</style>`;
}

function generateFomanticView(schema) {
    // Similar to Bootstrap view but with Fomantic UI classes
    return generateBootstrapView(schema)
        .replace(/class="btn btn-primary"/g, 'class="ui primary button"')
        .replace(/class="btn btn-secondary"/g, 'class="ui button"')
        .replace(/class="modal fade"/g, 'class="ui modal"')
        .replace(/class="modal-dialog"/g, 'class="content"')
        .replace(/class="modal-content"/g, 'class="description"')
        .replace(/class="modal-header"/g, 'class="header"')
        .replace(/class="modal-body"/g, 'class="content"')
        .replace(/class="modal-footer"/g, 'class="actions"')
        .replace(/class="form-control"/g, 'class="ui input"')
        .replace(/class="form-select"/g, 'class="ui dropdown"')
        .replace(/class="form-label"/g, 'class="ui label"')
        .replace(/class="mb-3"/g, 'class="field"')
        .replace(/bootstrap/g, 'fomantic');
}

export {
    generateInterface,
    generateService,
    generateStore,
    generateConfig,
    generateBootstrapView,
    generateFomanticView
};
