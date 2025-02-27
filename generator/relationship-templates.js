function pluralize(word) {
    // Basic pluralization rules - can be expanded as needed
    if (word.endsWith('y')) {
        return word.slice(0, -1) + 'ies';
    }
    return word + 's';
}

export function generateRelationshipService(relationshipType) {
    const Type = relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1);
    const types = pluralize(relationshipType);
    const Types = pluralize(Type);

    return `import type { ${Type} } from '../interfaces/product.interface'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const use${Type}Service = () => {
  const get${Types} = async (): Promise<${Type}[]> => {
    const response = await axios.get(\`\${API_URL}/${types}\`, {
      headers: {
        Authorization: \`Bearer \${localStorage.getItem('idToken')}\`
      }
    })
    return response.data.data
  }

  const get${Type}ById = async (id: string): Promise<${Type}> => {
    const response = await axios.get(\`\${API_URL}/${types}/\${id}\`, {
      headers: {
        Authorization: \`Bearer \${localStorage.getItem('idToken')}\`
      }
    })
    return response.data.data
  }

  return {
    get${Types},
    get${Type}ById
  }
}`
}

export function generateRelationshipStore(relationshipType) {
    const Type = relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1);
    const types = pluralize(relationshipType);
    const Types = pluralize(Type);

    return `import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ${Type} } from '../interfaces/product.interface'
import { use${Type}Service } from '../services/${relationshipType}.service'

export const use${Type}Store = defineStore('${relationshipType}', () => {
  const ${types} = ref<${Type}[]>([])
  const current${Type} = ref<${Type} | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const ${relationshipType}Service = use${Type}Service()

  const fetch${Types} = async () => {
    loading.value = true
    error.value = null
    try {
      ${types}.value = await ${relationshipType}Service.get${Types}()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch ${types}'
    } finally {
      loading.value = false
    }
  }

  const fetch${Type}ById = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      current${Type}.value = await ${relationshipType}Service.get${Type}ById(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch ${relationshipType}'
      current${Type}.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    ${types},
    current${Type},
    loading,
    error,
    fetch${Types},
    fetch${Type}ById
  }
})`
}
