import { TestCase, TestSuite } from '@/types/qa-types'
import * as XLSX from 'xlsx'

export interface ExportTemplate {
  id: string
  name: string
  description: string
  format: 'excel' | 'csv' | 'json' | 'pdf' | 'html'
  fields: ExportField[]
  settings: ExportSettings
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ExportField {
  key: keyof TestCase | 'customField' | 'calculated'
  label: string
  included: boolean
  order: number
  transformation?: string
  customFieldKey?: string // For custom fields
  calculatedFunction?: string // For calculated fields
  width?: number // For Excel/PDF formatting
  alignment?: 'left' | 'center' | 'right'
}

export interface ExportSettings {
  includeHeaders: boolean
  includeEmptyFields: boolean
  dateFormat: string
  numberFormat: string
  groupBy?: keyof TestCase
  sortBy?: keyof TestCase
  sortOrder: 'asc' | 'desc'
  filters?: ExportFilter[]
  styling?: ExportStyling
}

export interface ExportFilter {
  field: keyof TestCase
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn'
  value: any
}

export interface ExportStyling {
  headerStyle?: CellStyle
  dataStyle?: CellStyle
  alternatingRows?: boolean
  borderStyle?: 'none' | 'thin' | 'medium' | 'thick'
  fontSize?: number
  fontFamily?: string
}

export interface CellStyle {
  backgroundColor?: string
  textColor?: string
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  alignment?: 'left' | 'center' | 'right'
}

export interface ExportOptions {
  template: ExportTemplate
  data: TestCase[]
  fileName?: string
  includeMetadata?: boolean
  customFields?: Record<string, any>[]
}

export interface ExportResult {
  success: boolean
  fileName: string
  fileSize?: number
  recordCount: number
  errors: string[]
  warnings: string[]
  downloadUrl?: string // For web downloads
}

// Default export templates
export const DEFAULT_EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    id: 'standard-excel',
    name: 'Standard Excel Export',
    description: 'Complete test case export with all fields',
    format: 'excel',
    fields: [
      { key: 'testCase', label: 'Test Case', included: true, order: 1, width: 200 },
      { key: 'description', label: 'Description', included: true, order: 2, width: 300 },
      { key: 'stepsToReproduce', label: 'Steps', included: true, order: 3, width: 400 },
      { key: 'expectedResult', label: 'Expected Result', included: true, order: 4, width: 300 },
      { key: 'status', label: 'Status', included: true, order: 5, width: 100 },
      { key: 'priority', label: 'Priority', included: true, order: 6, width: 100 },
      { key: 'category', label: 'Category', included: true, order: 7, width: 120 },
      { key: 'assignedTester', label: 'Assigned To', included: true, order: 8, width: 150 },
      { key: 'executionDate', label: 'Execution Date', included: true, order: 9, width: 120 },
      { key: 'environment', label: 'Environment', included: true, order: 10, width: 100 },
      { key: 'platform', label: 'Platform', included: true, order: 11, width: 100 }
    ],
    settings: {
      includeHeaders: true,
      includeEmptyFields: false,
      dateFormat: 'YYYY-MM-DD',
      numberFormat: '#,##0',
      sortBy: 'testCase',
      sortOrder: 'asc',
      styling: {
        headerStyle: {
          backgroundColor: '#4F46E5',
          textColor: '#FFFFFF',
          fontWeight: 'bold',
          alignment: 'center'
        },
        alternatingRows: true,
        borderStyle: 'thin',
        fontSize: 11,
        fontFamily: 'Arial'
      }
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'summary-csv',
    name: 'Summary CSV Export',
    description: 'Basic test case information for reporting',
    format: 'csv',
    fields: [
      { key: 'testCase', label: 'Test Case', included: true, order: 1 },
      { key: 'description', label: 'Description', included: true, order: 2 },
      { key: 'status', label: 'Status', included: true, order: 3 },
      { key: 'priority', label: 'Priority', included: true, order: 4 },
      { key: 'assignedTester', label: 'Assigned To', included: true, order: 5 },
      { key: 'executionDate', label: 'Last Executed', included: true, order: 6 }
    ],
    settings: {
      includeHeaders: true,
      includeEmptyFields: false,
      dateFormat: 'MM/DD/YYYY',
      numberFormat: '#,##0',
      sortBy: 'status',
      sortOrder: 'asc'
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'execution-report',
    name: 'Test Execution Report',
    description: 'Detailed execution results with actual vs expected',
    format: 'excel',
    fields: [
      { key: 'testCase', label: 'Test Case ID', included: true, order: 1, width: 150 },
      { key: 'description', label: 'Test Description', included: true, order: 2, width: 300 },
      { key: 'expectedResult', label: 'Expected Result', included: true, order: 3, width: 250 },
      { key: 'actualResult', label: 'Actual Result', included: true, order: 4, width: 250 },
      { key: 'status', label: 'Result', included: true, order: 5, width: 100 },
      { key: 'assignedTester', label: 'Tester', included: true, order: 6, width: 120 },
      { key: 'executionDate', label: 'Execution Date', included: true, order: 7, width: 120 },
      { key: 'environment', label: 'Environment', included: true, order: 8, width: 100 },
      { key: 'notes', label: 'Comments', included: true, order: 9, width: 300 }
    ],
    settings: {
      includeHeaders: true,
      includeEmptyFields: true,
      dateFormat: 'MM/DD/YYYY HH:mm',
      numberFormat: '#,##0',
      sortBy: 'executionDate',
      sortOrder: 'desc',
      filters: [
        { field: 'status', operator: 'in', value: ['Pass', 'Fail', 'Blocked'] }
      ],
      styling: {
        headerStyle: {
          backgroundColor: '#059669',
          textColor: '#FFFFFF',
          fontWeight: 'bold'
        },
        alternatingRows: true,
        borderStyle: 'thin'
      }
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'json-api',
    name: 'JSON API Export',
    description: 'Complete test case data in JSON format for API integration',
    format: 'json',
    fields: [
      { key: 'id', label: 'ID', included: true, order: 1 },
      { key: 'testCase', label: 'testCase', included: true, order: 2 },
      { key: 'description', label: 'description', included: true, order: 3 },
      { key: 'stepsToReproduce', label: 'steps', included: true, order: 4 },
      { key: 'expectedResult', label: 'expectedResult', included: true, order: 5 },
      { key: 'actualResult', label: 'actualResult', included: true, order: 6 },
      { key: 'status', label: 'status', included: true, order: 7 },
      { key: 'priority', label: 'priority', included: true, order: 8 },
      { key: 'category', label: 'category', included: true, order: 9 },
      { key: 'assignedTester', label: 'assignedTester', included: true, order: 10 },
      { key: 'executionDate', label: 'executionDate', included: true, order: 11 },
      { key: 'createdAt', label: 'createdAt', included: true, order: 12 },
      { key: 'updatedAt', label: 'updatedAt', included: true, order: 13 }
    ],
    settings: {
      includeHeaders: false,
      includeEmptyFields: true,
      dateFormat: 'ISO',
      numberFormat: 'raw',
      sortBy: 'createdAt',
      sortOrder: 'asc'
    },
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export class ExportTemplateManager {
  private templates: Map<string, ExportTemplate> = new Map()
  private readonly storageKey = 'qa-export-templates'

  constructor() {
    this.loadTemplates()
  }

  private loadTemplates() {
    // Load default templates
    DEFAULT_EXPORT_TEMPLATES.forEach(template => {
      this.templates.set(template.id, template)
    })

    // Load custom templates from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey)
        if (stored) {
          const customTemplates: ExportTemplate[] = JSON.parse(stored)
          customTemplates.forEach(template => {
            this.templates.set(template.id, template)
          })
        }
      } catch (error) {
        console.warn('Failed to load export templates from localStorage:', error)
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
        console.warn('Failed to save export templates to localStorage:', error)
      }
    }
  }

  getAllTemplates(): ExportTemplate[] {
    return Array.from(this.templates.values()).sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      return a.name.localeCompare(b.name)
    })
  }

  getTemplate(id: string): ExportTemplate | undefined {
    return this.templates.get(id)
  }

  getTemplatesByFormat(format: ExportTemplate['format']): ExportTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.format === format)
  }

  createTemplate(template: Omit<ExportTemplate, 'id' | 'createdAt' | 'updatedAt'>): ExportTemplate {
    const newTemplate: ExportTemplate = {
      ...template,
      id: `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.templates.set(newTemplate.id, newTemplate)
    this.saveCustomTemplates()
    return newTemplate
  }

  updateTemplate(id: string, updates: Partial<ExportTemplate>): ExportTemplate | null {
    const existing = this.templates.get(id)
    if (!existing || existing.isDefault) {
      return null
    }

    const updated: ExportTemplate = {
      ...existing,
      ...updates,
      id,
      isDefault: false,
      updatedAt: new Date()
    }

    this.templates.set(id, updated)
    this.saveCustomTemplates()
    return updated
  }

  deleteTemplate(id: string): boolean {
    const template = this.templates.get(id)
    if (!template || template.isDefault) {
      return false
    }

    this.templates.delete(id)
    this.saveCustomTemplates()
    return true
  }
}

// Export processor
export class ExportProcessor {
  constructor(private templateManager: ExportTemplateManager) {}

  async exportData(options: ExportOptions): Promise<ExportResult> {
    const { template, data, fileName, includeMetadata = false } = options
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Apply filters
      let filteredData = this.applyFilters(data, template.settings.filters || [])
      
      // Apply sorting
      if (template.settings.sortBy) {
        filteredData = this.applySorting(filteredData, template.settings.sortBy, template.settings.sortOrder)
      }

      // Transform data based on template fields
      const transformedData = this.transformData(filteredData, template.fields, template.settings)

      // Generate export based on format
      const result = await this.generateExport(transformedData, template, fileName)

      return {
        success: true,
        fileName: result.fileName,
        fileSize: result.fileSize,
        recordCount: filteredData.length,
        errors,
        warnings,
        downloadUrl: result.downloadUrl
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown export error')
      return {
        success: false,
        fileName: fileName || 'export',
        recordCount: 0,
        errors,
        warnings
      }
    }
  }

  private applyFilters(data: TestCase[], filters: ExportFilter[]): TestCase[] {
    return data.filter(testCase => {
      return filters.every(filter => {
        const value = testCase[filter.field]
        const filterValue = filter.value

        switch (filter.operator) {
          case 'equals':
            return value === filterValue
          case 'contains':
            return value?.toString().toLowerCase().includes(filterValue.toString().toLowerCase())
          case 'startsWith':
            return value?.toString().toLowerCase().startsWith(filterValue.toString().toLowerCase())
          case 'endsWith':
            return value?.toString().toLowerCase().endsWith(filterValue.toString().toLowerCase())
          case 'in':
            return Array.isArray(filterValue) && filterValue.includes(value)
          case 'notIn':
            return Array.isArray(filterValue) && !filterValue.includes(value)
          default:
            return true
        }
      })
    })
  }

  private applySorting(data: TestCase[], sortBy: keyof TestCase, sortOrder: 'asc' | 'desc'): TestCase[] {
    return [...data].sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]

      if (aValue === bValue) return 0
      
      let comparison = 0
      if (aValue > bValue) comparison = 1
      if (aValue < bValue) comparison = -1

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  private transformData(data: TestCase[], fields: ExportField[], settings: ExportSettings): any[] {
    const includedFields = fields
      .filter(field => field.included)
      .sort((a, b) => a.order - b.order)

    return data.map(testCase => {
      const transformedRow: any = {}

      includedFields.forEach(field => {
        let value = testCase[field.key as keyof TestCase]

        // Apply transformations
        if (field.transformation) {
          value = this.applyTransformation(value, field.transformation, settings)
        }

        // Skip empty fields if configured
        if (!settings.includeEmptyFields && (value === null || value === undefined || value === '')) {
          return
        }

        transformedRow[field.label] = value
      })

      return transformedRow
    })
  }

  private applyTransformation(value: any, transformation: string, settings: ExportSettings): any {
    if (value === null || value === undefined) return value

    switch (transformation) {
      case 'uppercase':
        return value.toString().toUpperCase()
      case 'lowercase':
        return value.toString().toLowerCase()
      case 'date_format':
        if (value instanceof Date) {
          return this.formatDate(value, settings.dateFormat)
        }
        return value
      case 'number_format':
        if (typeof value === 'number') {
          return this.formatNumber(value, settings.numberFormat)
        }
        return value
      default:
        return value
    }
  }

  private formatDate(date: Date, format: string): string {
    switch (format) {
      case 'ISO':
        return date.toISOString()
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0]
      case 'MM/DD/YYYY':
        return date.toLocaleDateString('en-US')
      case 'DD/MM/YYYY':
        return date.toLocaleDateString('en-GB')
      case 'MM/DD/YYYY HH:mm':
        return date.toLocaleString('en-US')
      default:
        return date.toLocaleDateString()
    }
  }

  private formatNumber(num: number, format: string): string {
    switch (format) {
      case 'raw':
        return num.toString()
      case '#,##0':
        return num.toLocaleString()
      case '#,##0.00':
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      default:
        return num.toString()
    }
  }

  private async generateExport(
    data: any[], 
    template: ExportTemplate, 
    fileName?: string
  ): Promise<{ fileName: string; fileSize: number; downloadUrl?: string }> {
    const timestamp = new Date().toISOString().split('T')[0]
    const defaultFileName = `${template.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`
    const finalFileName = fileName || defaultFileName

    switch (template.format) {
      case 'excel':
        return this.generateExcelExport(data, template, finalFileName)
      case 'csv':
        return this.generateCSVExport(data, template, finalFileName)
      case 'json':
        return this.generateJSONExport(data, template, finalFileName)
      default:
        throw new Error(`Unsupported export format: ${template.format}`)
    }
  }

  private async generateExcelExport(
    data: any[], 
    template: ExportTemplate, 
    fileName: string
  ): Promise<{ fileName: string; fileSize: number; downloadUrl?: string }> {
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Apply column widths
    const colWidths = template.fields
      .filter(field => field.included && field.width)
      .map(field => ({ wch: field.width! / 7 })) // Approximate character width

    if (colWidths.length > 0) {
      worksheet['!cols'] = colWidths
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases')
    
    const fullFileName = `${fileName}.xlsx`
    XLSX.writeFile(workbook, fullFileName)

    // For browser environment, we can't easily get file size
    // This would need to be implemented based on your specific needs
    return {
      fileName: fullFileName,
      fileSize: 0 // Would need actual implementation
    }
  }

  private async generateCSVExport(
    data: any[], 
    template: ExportTemplate, 
    fileName: string
  ): Promise<{ fileName: string; fileSize: number; downloadUrl?: string }> {
    const headers = template.fields
      .filter(field => field.included)
      .sort((a, b) => a.order - b.order)
      .map(field => field.label)

    let csvContent = ''
    
    if (template.settings.includeHeaders) {
      csvContent += headers.join(',') + '\n'
    }

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      })
      csvContent += values.join(',') + '\n'
    })

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const fullFileName = `${fileName}.csv`
    
    // Trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = fullFileName
    link.click()
    
    return {
      fileName: fullFileName,
      fileSize: blob.size,
      downloadUrl: url
    }
  }

  private async generateJSONExport(
    data: any[], 
    template: ExportTemplate, 
    fileName: string
  ): Promise<{ fileName: string; fileSize: number; downloadUrl?: string }> {
    const jsonContent = JSON.stringify(data, null, 2)
    
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const fullFileName = `${fileName}.json`
    
    // Trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = fullFileName
    link.click()
    
    return {
      fileName: fullFileName,
      fileSize: blob.size,
      downloadUrl: url
    }
  }
}

// Global instances
export const exportTemplateManager = new ExportTemplateManager()
export const exportProcessor = new ExportProcessor(exportTemplateManager)
