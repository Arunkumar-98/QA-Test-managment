// 🚀 NEW DYNAMIC IMPORT PROCESSOR
// This completely replaces the old rigid import system with a flexible one

import { TestCase, CustomColumn } from '@/types/qa-types'
import * as XLSX from 'xlsx'

export interface DynamicImportOptions {
  file: File
  projectId: string
  suiteId?: string
}

export interface DynamicImportResult {
  testCases: TestCase[]
  newColumns: CustomColumn[]
  summary: {
    totalRows: number
    successfulImports: number
    newColumnsCreated: number
  }
  warnings: string[]
}

export class DynamicImportProcessor {
  private options: DynamicImportOptions
  
  constructor(options: DynamicImportOptions) {
    this.options = options
  }

  async processImport(): Promise<DynamicImportResult> {
    const fileContent = await this.readFile()
    const rawData = this.parseFile(fileContent)
    
    if (rawData.length === 0) {
      throw new Error('No data found in file')
    }

    // Get headers from first row
    const headers = Object.keys(rawData[0])
    console.log('📊 Detected Headers:', headers)

    // Create new columns for each header
    const newColumns = this.createColumnsFromHeaders(headers)
    
    // Convert raw data to dynamic test cases
    const testCases = this.convertToTestCases(rawData)

    return {
      testCases,
      newColumns,
      summary: {
        totalRows: rawData.length,
        successfulImports: testCases.length,
        newColumnsCreated: newColumns.length
      },
      warnings: []
    }
  }

  private async readFile(): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as ArrayBuffer)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      reader.onerror = () => reject(new Error('File reading error'))
      reader.readAsArrayBuffer(this.options.file)
    })
  }

  private parseFile(content: ArrayBuffer): any[] {
    const fileName = this.options.file.name.toLowerCase()
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return this.parseExcel(content)
    } else if (fileName.endsWith('.csv')) {
      return this.parseCSV(content)
    } else {
      throw new Error('Unsupported file format')
    }
  }

  private parseExcel(content: ArrayBuffer): any[] {
    const workbook = XLSX.read(content, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON with header row
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: false
    })
    
    if (data.length < 2) {
      throw new Error('File must have at least a header row and one data row')
    }

    // First row is headers, rest is data
    const headers = data[0] as string[]
    const rows = data.slice(1) as any[][]
    
    // Convert to object format
    return rows.map(row => {
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header] = row[index] || ''
      })
      return obj
    })
  }

  private parseCSV(content: ArrayBuffer): any[] {
    const text = new TextDecoder().decode(content)
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const rows = lines.slice(1)
    
    return rows.map(row => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
      const obj: any = {}
      headers.forEach((header, index) => {
        obj[header] = values[index] || ''
      })
      return obj
    })
  }

  private createColumnsFromHeaders(headers: string[]): CustomColumn[] {
    return headers.map((header, index) => ({
      id: `col_${Date.now()}_${index}`,
      name: this.sanitizeColumnName(header),
      label: header,
      type: this.detectColumnType(header),
      visible: true,
      width: 'w-48',
      minWidth: 'min-w-[200px]',
      projectId: this.options.projectId,
      position: index,
      options: this.getColumnOptions(header),
      isRequired: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  }

  private sanitizeColumnName(header: string): string {
    // Convert header to safe column name
    return header
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  private detectColumnType(header: string): 'text' | 'number' | 'boolean' | 'select' | 'date' {
    const lowerHeader = header.toLowerCase()
    
    if (lowerHeader.includes('date') || lowerHeader.includes('time')) {
      return 'date'
    }
    
    if (lowerHeader.includes('status') || lowerHeader.includes('priority') || lowerHeader.includes('category')) {
      return 'select'
    }
    
    if (lowerHeader.includes('count') || lowerHeader.includes('number') || lowerHeader.includes('time')) {
      return 'number'
    }
    
    if (lowerHeader.includes('enabled') || lowerHeader.includes('active') || lowerHeader.includes('flag')) {
      return 'boolean'
    }
    
    return 'text'
  }

  private getColumnOptions(header: string): string[] | undefined {
    const lowerHeader = header.toLowerCase()
    
    // Provide default options for common column types
    if (lowerHeader.includes('status')) {
      return ['Pass', 'Fail', 'Blocked', 'In Progress', 'Not Executed']
    }
    
    if (lowerHeader.includes('priority')) {
      return ['High', 'Medium', 'Low']
    }
    
    if (lowerHeader.includes('platform')) {
      return ['Android', 'iOS', 'Web', 'Desktop']
    }
    
    return undefined
  }

  private convertToTestCases(rawData: any[]): TestCase[] {
    return rawData.map((row, index) => {
      // Convert all row data to dynamic fields
      const dynamicFields: { [key: string]: string | number | boolean | null } = {}
      
      Object.keys(row).forEach(header => {
        const columnName = this.sanitizeColumnName(header)
        const value = row[header]
        
        // Convert value based on detected type
        dynamicFields[columnName] = this.convertValue(value, header)
      })

      return {
        id: `imported_${Date.now()}_${index}`,
        projectId: this.options.projectId,
        suiteId: this.options.suiteId,
        position: index,
        createdAt: new Date(),
        updatedAt: new Date(),
        dynamicFields
      }
    })
  }

  private convertValue(value: any, header: string): string | number | boolean | null {
    if (value === null || value === undefined || value === '') {
      return null
    }
    
    const columnType = this.detectColumnType(header)
    
    switch (columnType) {
      case 'number':
        const num = parseFloat(value)
        return isNaN(num) ? null : num
        
      case 'boolean':
        if (typeof value === 'boolean') return value
        const str = value.toString().toLowerCase()
        return str === 'true' || str === 'yes' || str === '1' || str === 'on'
        
      default:
        return value.toString()
    }
  }
}
