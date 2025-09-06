import { TestCase } from '@/types/qa-types'

export interface ImportTemplate {
  id: string
  name: string
  description: string
  source: string // e.g., 'Jira', 'Azure DevOps', 'TestRail', 'Custom'
  columnMappings: ColumnMapping[]
  settings: ImportTemplateSettings
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ColumnMapping {
  sourceColumn: string
  targetField: keyof TestCase | 'skip'
  transformation?: string // e.g., 'uppercase', 'lowercase', 'trim', 'date_format'
  defaultValue?: string
  required: boolean
  validator?: string // regex pattern or predefined validator name
}

export interface ImportTemplateSettings {
  skipEmptyRows: boolean
  trimWhitespace: boolean
  normalizeStatus: boolean
  normalizePriority: boolean
  normalizeCategory: boolean
  duplicateDetection: boolean
  autoFix: boolean
  strictValidation: boolean
}

// Default templates for common tools
export const DEFAULT_IMPORT_TEMPLATES: ImportTemplate[] = [
  {
    id: 'jira-export',
    name: 'Jira Test Export',
    description: 'Standard Jira test case export format',
    source: 'Jira',
    columnMappings: [
      { sourceColumn: 'Issue key', targetField: 'testCase', required: true },
      { sourceColumn: 'Summary', targetField: 'description', required: true },
      { sourceColumn: 'Status', targetField: 'status', required: false },
      { sourceColumn: 'Priority', targetField: 'priority', required: false },
      { sourceColumn: 'Issue Type', targetField: 'category', transformation: 'normalize_category', required: false },
      { sourceColumn: 'Assignee', targetField: 'assignedTester', required: false },
      { sourceColumn: 'Description', targetField: 'stepsToReproduce', required: false },
      { sourceColumn: 'Environment', targetField: 'environment', required: false }
    ],
    settings: {
      skipEmptyRows: true,
      trimWhitespace: true,
      normalizeStatus: true,
      normalizePriority: true,
      normalizeCategory: true,
      duplicateDetection: true,
      autoFix: true,
      strictValidation: false
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'azure-devops',
    name: 'Azure DevOps Test Cases',
    description: 'Azure DevOps test case export format',
    source: 'Azure DevOps',
    columnMappings: [
      { sourceColumn: 'ID', targetField: 'testCase', required: true },
      { sourceColumn: 'Title', targetField: 'description', required: true },
      { sourceColumn: 'State', targetField: 'status', transformation: 'normalize_azure_status', required: false },
      { sourceColumn: 'Priority', targetField: 'priority', required: false },
      { sourceColumn: 'Test Suite', targetField: 'category', required: false },
      { sourceColumn: 'Assigned To', targetField: 'assignedTester', required: false },
      { sourceColumn: 'Steps', targetField: 'stepsToReproduce', required: false },
      { sourceColumn: 'Expected Result', targetField: 'expectedResult', required: false }
    ],
    settings: {
      skipEmptyRows: true,
      trimWhitespace: true,
      normalizeStatus: true,
      normalizePriority: true,
      normalizeCategory: false,
      duplicateDetection: true,
      autoFix: true,
      strictValidation: false
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'testrail-export',
    name: 'TestRail Export',
    description: 'TestRail test case export format',
    source: 'TestRail',
    columnMappings: [
      { sourceColumn: 'ID', targetField: 'testCase', required: true },
      { sourceColumn: 'Title', targetField: 'description', required: true },
      { sourceColumn: 'Status', targetField: 'status', required: false },
      { sourceColumn: 'Priority', targetField: 'priority', required: false },
      { sourceColumn: 'Type', targetField: 'category', required: false },
      { sourceColumn: 'Steps', targetField: 'stepsToReproduce', required: false },
      { sourceColumn: 'Expected Result', targetField: 'expectedResult', required: false },
      { sourceColumn: 'Preconditions', targetField: 'prerequisites', required: false }
    ],
    settings: {
      skipEmptyRows: true,
      trimWhitespace: true,
      normalizeStatus: true,
      normalizePriority: true,
      normalizeCategory: true,
      duplicateDetection: true,
      autoFix: true,
      strictValidation: false
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'generic-csv',
    name: 'Generic CSV Template',
    description: 'Basic CSV template with common fields',
    source: 'Custom',
    columnMappings: [
      { sourceColumn: 'Test Case', targetField: 'testCase', required: true },
      { sourceColumn: 'Description', targetField: 'description', required: true },
      { sourceColumn: 'Steps', targetField: 'stepsToReproduce', required: false },
      { sourceColumn: 'Expected Result', targetField: 'expectedResult', required: false },
      { sourceColumn: 'Status', targetField: 'status', required: false },
      { sourceColumn: 'Priority', targetField: 'priority', required: false },
      { sourceColumn: 'Category', targetField: 'category', required: false },
      { sourceColumn: 'Assigned To', targetField: 'assignedTester', required: false }
    ],
    settings: {
      skipEmptyRows: true,
      trimWhitespace: true,
      normalizeStatus: true,
      normalizePriority: true,
      normalizeCategory: true,
      duplicateDetection: true,
      autoFix: true,
      strictValidation: false
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Template management functions
export class ImportTemplateManager {
  private templates: Map<string, ImportTemplate> = new Map()
  private readonly storageKey = 'qa-import-templates'

  constructor() {
    this.loadTemplates()
  }

  private loadTemplates() {
    // Load default templates
    DEFAULT_IMPORT_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template)
    })

    // Load custom templates from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
          const customTemplates: ImportTemplate[] = JSON.parse(stored)
          customTemplates.forEach(template => {
            this.templates.set(template.id, template)
          })
        }
      } catch (error) {
        console.warn('Failed to load import templates from localStorage:', error)
      }
    }
  }

  private saveCustomTemplates() {
    if (typeof window !== 'undefined') {
      try {
        const customTemplates = Array.from(this.templates.values())
          .filter(template => !template.isDefault)
        localStorage.setItem(this.storageKey, JSON.stringify(customTemplates))
      } catch (error) {
        console.warn('Failed to save import templates to localStorage:', error)
      }
    }
  }

  getAllTemplates(): ImportTemplate[] {
    return Array.from(this.templates.values()).sort((a, b) => {
      // Sort by default first, then by name
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      return a.name.localeCompare(b.name)
    })
  }

  getTemplate(id: string): ImportTemplate | undefined {
    return this.templates.get(id)
  }

  createTemplate(template: Omit<ImportTemplate, 'id' | 'createdAt' | 'updatedAt'>): ImportTemplate {
    const newTemplate: ImportTemplate = {
      ...template,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.templates.set(newTemplate.id, newTemplate)
    this.saveCustomTemplates()
    return newTemplate
  }

  updateTemplate(id: string, updates: Partial<ImportTemplate>): ImportTemplate | null {
    const existing = this.templates.get(id)
    if (!existing || existing.isDefault) {
      return null // Cannot update default templates
    }

    const updated: ImportTemplate = {
      ...existing,
      ...updates,
      id, // Preserve ID
      isDefault: false, // Ensure custom templates remain custom
      updatedAt: new Date()
    }

    this.templates.set(id, updated)
    this.saveCustomTemplates()
    return updated
  }

  deleteTemplate(id: string): boolean {
    const template = this.templates.get(id)
    if (!template || template.isDefault) {
      return false // Cannot delete default templates
    }

    this.templates.delete(id)
    this.saveCustomTemplates()
    return true
  }

  duplicateTemplate(id: string, newName?: string): ImportTemplate | null {
    const original = this.templates.get(id)
    if (!original) return null

    return this.createTemplate({
      ...original,
      name: newName || `${original.name} (Copy)`,
      description: `Copy of ${original.description}`
    })
  }

  // Auto-detect best matching template based on column headers
  detectBestTemplate(headers: string[]): ImportTemplate | null {
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim())
    let bestMatch: ImportTemplate | null = null
    let bestScore = 0

    for (const template of this.templates.values()) {
      let score = 0
      let matchedColumns = 0

      for (const mapping of template.columnMappings) {
        const sourceColumn = mapping.sourceColumn.toLowerCase().trim()
        
        // Exact match
        if (normalizedHeaders.includes(sourceColumn)) {
          score += mapping.required ? 3 : 2
          matchedColumns++
          continue
        }

        // Partial match
        const partialMatch = normalizedHeaders.find(header => 
          header.includes(sourceColumn) || sourceColumn.includes(header)
        )
        if (partialMatch) {
          score += mapping.required ? 2 : 1
          matchedColumns++
        }
      }

      // Bonus for matching more columns
      const matchRatio = matchedColumns / template.columnMappings.length
      score += matchRatio * 2

      if (score > bestScore) {
        bestScore = score
        bestMatch = template
      }
    }

    // Only return if we have a reasonable match
    return bestScore > 3 ? bestMatch : null
  }

  // Apply template transformations to a value
  applyTransformation(value: any, transformation?: string): any {
    if (!transformation || !value) return value

    const stringValue = value.toString()

    switch (transformation) {
      case 'uppercase':
        return stringValue.toUpperCase()
      
      case 'lowercase':
        return stringValue.toLowerCase()
      
      case 'trim':
        return stringValue.trim()
      
      case 'normalize_category':
        const categoryMap: Record<string, string> = {
          'bug': 'Functional',
          'story': 'Functional',
          'task': 'Functional',
          'epic': 'Integration',
          'test': 'Functional'
        }
        return categoryMap[stringValue.toLowerCase()] || stringValue
      
      case 'normalize_azure_status':
        const azureStatusMap: Record<string, string> = {
          'new': 'Pending',
          'active': 'In Progress',
          'resolved': 'Pass',
          'closed': 'Pass',
          'removed': 'Blocked'
        }
        return azureStatusMap[stringValue.toLowerCase()] || stringValue
      
      case 'date_format':
        try {
          const date = new Date(stringValue)
          return isNaN(date.getTime()) ? stringValue : date.toISOString().split('T')[0]
        } catch {
          return stringValue
        }
      
      default:
        return value
    }
  }

  // Generate a template from sample data
  generateTemplateFromSample(
    headers: string[], 
    sampleRows: any[], 
    templateName: string,
    templateDescription: string
  ): ImportTemplate {
    const columnMappings: ColumnMapping[] = headers.map(header => {
      // Try to auto-detect field mapping based on header name
      const normalizedHeader = header.toLowerCase().trim()
      let targetField: keyof TestCase | 'skip' = 'skip'
      let required = false

      // Simple mapping based on common header names
      const mappings: Record<string, { field: keyof TestCase, required: boolean }> = {
        'test case': { field: 'testCase', required: true },
        'test case id': { field: 'testCase', required: true },
        'test case name': { field: 'testCase', required: true },
        'id': { field: 'testCase', required: true },
        'title': { field: 'testCase', required: true },
        'name': { field: 'testCase', required: true },
        'description': { field: 'description', required: true },
        'summary': { field: 'description', required: true },
        'steps': { field: 'stepsToReproduce', required: false },
        'test steps': { field: 'stepsToReproduce', required: false },
        'steps to reproduce': { field: 'stepsToReproduce', required: false },
        'expected result': { field: 'expectedResult', required: false },
        'expected': { field: 'expectedResult', required: false },
        'status': { field: 'status', required: false },
        'priority': { field: 'priority', required: false },
        'category': { field: 'category', required: false },
        'type': { field: 'category', required: false },
        'assigned to': { field: 'assignedTester', required: false },
        'assignee': { field: 'assignedTester', required: false },
        'tester': { field: 'assignedTester', required: false },
        'environment': { field: 'environment', required: false },
        'platform': { field: 'platform', required: false },
        'notes': { field: 'notes', required: false },
        'comments': { field: 'notes', required: false },
        'prerequisites': { field: 'prerequisites', required: false },
        'preconditions': { field: 'prerequisites', required: false }
      }

      const mapping = mappings[normalizedHeader]
      if (mapping) {
        targetField = mapping.field
        required = mapping.required
      }

      return {
        sourceColumn: header,
        targetField,
        required,
        transformation: targetField === 'status' ? 'normalize_status' : undefined
      }
    })

    return this.createTemplate({
      name: templateName,
      description: templateDescription,
      source: 'Custom',
      columnMappings,
      settings: {
        skipEmptyRows: true,
        trimWhitespace: true,
        normalizeStatus: true,
        normalizePriority: true,
        normalizeCategory: true,
        duplicateDetection: true,
        autoFix: true,
        strictValidation: false
      }
    })
  }
}

// Global instance
export const importTemplateManager = new ImportTemplateManager()
