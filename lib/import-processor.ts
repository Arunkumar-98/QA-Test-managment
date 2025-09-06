import { TestCase } from '@/types/qa-types'
import { parseCSVEnhanced, ParsedCSVResult } from './enhanced-csv-parser'
import { detectDuplicates, DuplicateDetectionResult, DuplicateDetectionOptions } from './duplicate-detector'
import { validateTestCaseData, ValidationResult, autoFixData } from './import-validator'
import { mapImportedDataToTestCase } from './utils'
import * as XLSX from 'xlsx'

export interface ImportOptions {
  file: File
  projectId: string
  suiteId?: string
  duplicateDetection: Partial<DuplicateDetectionOptions>
  validation: {
    autoFix: boolean
    strictMode: boolean
  }
  processing: {
    batchSize: number
    maxConcurrency: number
  }
}

export interface ImportProgress {
  stage: 'reading' | 'parsing' | 'validating' | 'detecting_duplicates' | 'processing' | 'saving' | 'complete'
  progress: number // 0-100
  current: number
  total: number
  message: string
  errors?: string[]
  warnings?: string[]
}

export interface ImportResult {
  success: boolean
  imported: TestCase[]
  skipped: Partial<TestCase>[]
  errors: string[]
  warnings: string[]
  duplicates?: DuplicateDetectionResult
  validation?: ValidationResult
  summary: {
    totalRows: number
    successfulImports: number
    skippedRows: number
    errorCount: number
    warningCount: number
    processingTime: number
  }
}

export class ImportProcessor {
  private options: ImportOptions
  private progressCallback?: (progress: ImportProgress) => void
  private startTime: number = 0

  constructor(options: ImportOptions, progressCallback?: (progress: ImportProgress) => void) {
    this.options = options
    this.progressCallback = progressCallback
  }

  private updateProgress(stage: ImportProgress['stage'], progress: number, message: string, current?: number, total?: number) {
    if (this.progressCallback) {
      this.progressCallback({
        stage,
        progress: Math.min(Math.max(progress, 0), 100),
        current: current || 0,
        total: total || 0,
        message
      })
    }
  }

  async processImport(): Promise<ImportResult> {
    this.startTime = Date.now()
    
    try {
      // Stage 1: Read file
      this.updateProgress('reading', 0, 'Reading file...')
      const fileContent = await this.readFile()
      
      // Stage 2: Parse data
      this.updateProgress('parsing', 10, 'Parsing file content...')
      const parsedData = await this.parseFile(fileContent)
      
      if (parsedData.data.length === 0) {
        throw new Error('No data found in file')
      }

      // Stage 3: Apply field mapping first
      this.updateProgress('validating', 30, 'Mapping fields and validating data...')
      
      // Apply field mapping to transform the data before validation
      const mappedData = parsedData.data.map((item, index) => 
        mapImportedDataToTestCase(item, index, this.options.projectId, this.options.suiteId)
      )
      
      const validation = validateTestCaseData(mappedData)
      
      // Auto-fix if enabled (apply to mapped data)
      let processedData = mappedData
      let fixesApplied: string[] = []
      
      if (this.options.validation.autoFix) {
        const autoFixResult = autoFixData(mappedData, {
          trimWhitespace: true,
          normalizeStatus: true,
          normalizePriority: true,
          normalizeCategory: true,
          generateMissingFields: !this.options.validation.strictMode
        })
        processedData = autoFixResult.fixedData
        fixesApplied = autoFixResult.fixesApplied
      }

      // Stage 4: Detect duplicates
      this.updateProgress('detecting_duplicates', 50, 'Detecting duplicates...')
      
      const duplicates = detectDuplicates(processedData, this.options.duplicateDetection)

      // Stage 5: Process and prepare for import
      this.updateProgress('processing', 70, 'Processing test cases...')
      const finalData = this.prepareFinalData(duplicates.uniqueItems, processedData)

      // Stage 6: Simulate saving (actual saving would be done by the calling component)
      this.updateProgress('saving', 90, 'Preparing for import...')
      
      // Stage 7: Complete
      this.updateProgress('complete', 100, 'Import processing complete!')

      const processingTime = Date.now() - this.startTime
      
      return {
        success: validation.errors.length === 0 || !this.options.validation.strictMode,
        imported: finalData,
        skipped: duplicates.duplicateGroups.flatMap(g => g.duplicates),
        errors: [
          ...parsedData.errors,
          ...validation.errors.map(e => `Row ${e.row}: ${e.message}`)
        ],
        warnings: [
          ...parsedData.warnings,
          ...validation.warnings.map(w => `Row ${w.row}: ${w.message}`),
          ...fixesApplied
        ],
        duplicates,
        validation,
        summary: {
          totalRows: parsedData.data.length,
          successfulImports: finalData.length,
          skippedRows: duplicates.totalDuplicates,
          errorCount: validation.errors.length,
          warningCount: validation.warnings.length + fixesApplied.length,
          processingTime
        }
      }

    } catch (error) {
      const processingTime = Date.now() - this.startTime
      return {
        success: false,
        imported: [],
        skipped: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        warnings: [],
        summary: {
          totalRows: 0,
          successfulImports: 0,
          skippedRows: 0,
          errorCount: 1,
          warningCount: 0,
          processingTime
        }
      }
    }
  }

  private async readFile(): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      
      reader.onerror = () => reject(new Error('File reading error'))
      
      const fileExtension = this.options.file.name.toLowerCase().split('.').pop()
      
      if (fileExtension === 'csv') {
        reader.readAsText(this.options.file)
      } else {
        reader.readAsArrayBuffer(this.options.file)
      }
    })
  }

  private async parseFile(content: string | ArrayBuffer): Promise<ParsedCSVResult> {
    const fileExtension = this.options.file.name.toLowerCase().split('.').pop()
    
    if (fileExtension === 'csv') {
      return parseCSVEnhanced(content as string)
    } else if (fileExtension === 'tsv' || fileExtension === 'txt') {
      // Parse TSV (Tab-separated values)
      return parseCSVEnhanced(content as string, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        trimHeaders: true,
        transformHeader: (header: string, index: number) => {
          return header.trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ') || `Column_${index + 1}`
        }
      })
    } else if (fileExtension === 'json') {
      // Parse JSON file
      try {
        const jsonData = JSON.parse(content as string)
        const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData]
        
        return {
          data: dataArray,
          errors: [],
          warnings: dataArray.length === 0 ? ['No data found in JSON file'] : [],
          meta: {
            delimiter: '',
            linebreak: '',
            aborted: false,
            truncated: false,
            cursor: 0
          }
        }
      } catch (error) {
        return {
          data: [],
          errors: [`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: [],
          meta: {
            delimiter: '',
            linebreak: '',
            aborted: true,
            truncated: false,
            cursor: 0
          }
        }
      }
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parse Excel file
      const data = new Uint8Array(content as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      return {
        data: jsonData,
        errors: [],
        warnings: jsonData.length === 0 ? ['No data found in Excel file'] : [],
        meta: {
          delimiter: '',
          linebreak: '',
          aborted: false,
          truncated: false,
          cursor: 0
        }
      }
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}. Supported formats: CSV, TSV, JSON, Excel (.xlsx, .xls)`)
    }
  }

  private prepareFinalData(uniqueItems: Partial<TestCase>[], allData: Partial<TestCase>[]): TestCase[] {
    return uniqueItems.map((item, index) => ({
      id: `imported-${Date.now()}-${index}`, // Generate unique ID for React keys
      testCase: item.testCase || `Imported Test Case ${index + 1}`,
      description: item.description || '',
      expectedResult: item.expectedResult || '',
      status: item.status || 'Not Executed',
      priority: item.priority || 'P2 (Medium)',
      category: item.category || 'Other',
      assignedTester: item.assignedTester || '',
      executionDate: item.executionDate || '',
      notes: item.notes || '',
      actualResult: item.actualResult || '',
      environment: item.environment || '',
      prerequisites: item.prerequisites || '',
      platform: item.platform || '',
      stepsToReproduce: item.stepsToReproduce || '',
      projectId: this.options.projectId,
      suiteId: this.options.suiteId,
      position: index + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      // New core columns with defaults
      qaStatus: 'New',
      devStatus: 'Open',
      assignedDev: '',
      bugStatus: 'New',
      testType: 'Functional',
      testLevel: 'System',
      defectSeverity: 'Major',
      defectPriority: 'P2',
      estimatedTime: 0,
      actualTime: 0,
      testData: '',
      attachments: [],
      tags: [],
      reviewer: '',
      reviewDate: '',
      reviewNotes: '',
      lastModifiedBy: 'Import System'
    } as TestCase))
  }
}

// Batch processing utility for large imports
export const processBatchImport = async (
  data: Partial<TestCase>[],
  batchSize: number = 100,
  processBatch: (batch: Partial<TestCase>[]) => Promise<TestCase[]>,
  onProgress?: (progress: { processed: number; total: number; currentBatch: number; totalBatches: number }) => void
): Promise<{ imported: TestCase[]; errors: string[] }> => {
  const imported: TestCase[] = []
  const errors: string[] = []
  const totalBatches = Math.ceil(data.length / batchSize)

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    const currentBatch = Math.floor(i / batchSize) + 1

    try {
      const batchResult = await processBatch(batch)
      imported.push(...batchResult)
      
      if (onProgress) {
        onProgress({
          processed: Math.min(i + batchSize, data.length),
          total: data.length,
          currentBatch,
          totalBatches
        })
      }
    } catch (error) {
      errors.push(`Batch ${currentBatch} failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Small delay to prevent overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return { imported, errors }
}
