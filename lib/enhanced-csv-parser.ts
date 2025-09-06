import Papa from 'papaparse'

export interface ParsedCSVResult {
  data: any[]
  errors: string[]
  warnings: string[]
  meta: {
    delimiter: string
    linebreak: string
    aborted: boolean
    truncated: boolean
    cursor: number
  }
}

export interface CSVParsingOptions {
  header: boolean
  dynamicTyping: boolean
  skipEmptyLines: boolean
  trimHeaders: boolean
  transformHeader?: (header: string, index: number) => string
  transform?: (value: string, field: string) => any
}

export const parseCSVEnhanced = (
  csvContent: string, 
  options: Partial<CSVParsingOptions> = {}
): ParsedCSVResult => {
  const defaultOptions: CSVParsingOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    trimHeaders: true,
    transformHeader: (header: string, index: number) => {
      // Clean and normalize header names
      return header.trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ') || `Column_${index + 1}`
    },
    transform: (value: string, field: string) => {
      // Clean and transform values
      if (typeof value === 'string') {
        return value.trim()
      }
      return value
    }
  }

  const finalOptions = { ...defaultOptions, ...options }
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const result = Papa.parse(csvContent, {
      header: finalOptions.header,
      dynamicTyping: finalOptions.dynamicTyping,
      skipEmptyLines: finalOptions.skipEmptyLines,
      transformHeader: finalOptions.transformHeader,
      transform: finalOptions.transform,
      complete: (results) => {
        // Collect parsing errors
        if (results.errors && results.errors.length > 0) {
          results.errors.forEach(error => {
            errors.push(`Row ${error.row + 1}: ${error.message}`)
          })
        }

        // Add warnings for common issues
        if (results.data.length === 0) {
          warnings.push('No data rows found in CSV file')
        }

        if (results.meta.truncated) {
          warnings.push('File appears to be truncated - some data may be missing')
        }
      }
    })

    // Validate data quality
    if (result.data && result.data.length > 0) {
      const firstRow = result.data[0]
      const headers = Object.keys(firstRow)
      
      // Check for empty headers
      const emptyHeaders = headers.filter(h => !h || h.trim() === '')
      if (emptyHeaders.length > 0) {
        warnings.push(`Found ${emptyHeaders.length} empty column headers`)
      }

      // Check for duplicate headers
      const headerCounts = headers.reduce((acc, header) => {
        acc[header] = (acc[header] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const duplicateHeaders = Object.entries(headerCounts)
        .filter(([_, count]) => count > 1)
        .map(([header, count]) => `"${header}" (${count} times)`)
      
      if (duplicateHeaders.length > 0) {
        warnings.push(`Duplicate column headers found: ${duplicateHeaders.join(', ')}`)
      }

      // Check for mostly empty rows
      const emptyRowCount = result.data.filter(row => {
        const values = Object.values(row)
        return values.every(val => !val || val.toString().trim() === '')
      }).length

      if (emptyRowCount > result.data.length * 0.5) {
        warnings.push(`${emptyRowCount} rows appear to be empty or contain only whitespace`)
      }
    }

    return {
      data: result.data || [],
      errors,
      warnings,
      meta: result.meta
    }
  } catch (error) {
    errors.push(`Critical parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      data: [],
      errors,
      warnings,
      meta: {
        delimiter: '',
        linebreak: '',
        aborted: true,
        truncated: false,
        cursor: 0
      }
    }
  }
}

// Enhanced CSV detection and validation
export const detectCSVFormat = (content: string): {
  isCSV: boolean
  delimiter: string
  hasHeaders: boolean
  rowCount: number
  columnCount: number
  confidence: number
} => {
  const lines = content.split('\n').filter(line => line.trim())
  
  if (lines.length === 0) {
    return {
      isCSV: false,
      delimiter: ',',
      hasHeaders: false,
      rowCount: 0,
      columnCount: 0,
      confidence: 0
    }
  }

  // Test different delimiters
  const delimiters = [',', ';', '\t', '|']
  let bestDelimiter = ','
  let bestScore = 0

  for (const delimiter of delimiters) {
    const firstLine = lines[0].split(delimiter)
    const secondLine = lines[1]?.split(delimiter) || []
    
    // Score based on consistency and reasonable column count
    let score = 0
    if (firstLine.length > 1 && firstLine.length <= 50) score += 2
    if (firstLine.length === secondLine.length) score += 3
    if (delimiter === ',') score += 1 // Slight preference for comma
    
    if (score > bestScore) {
      bestScore = score
      bestDelimiter = delimiter
    }
  }

  const firstRow = lines[0].split(bestDelimiter)
  const hasHeaders = firstRow.some(cell => 
    isNaN(Number(cell)) && cell.trim().length > 0
  )

  return {
    isCSV: bestScore > 0,
    delimiter: bestDelimiter,
    hasHeaders,
    rowCount: lines.length,
    columnCount: firstRow.length,
    confidence: Math.min(bestScore / 5, 1)
  }
}

// Validate CSV file before parsing
export const validateCSVFile = (file: File): Promise<{
  isValid: boolean
  errors: string[]
  warnings: string[]
  fileInfo: {
    size: number
    name: string
    type: string
  }
}> => {
  return new Promise((resolve) => {
    const errors: string[] = []
    const warnings: string[] = []
    
    // File size validation (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      errors.push(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (10MB)`)
    }
    
    if (file.size > 1024 * 1024) {
      warnings.push(`Large file detected (${Math.round(file.size / 1024 / 1024)}MB). Processing may take a while.`)
    }

    // File type validation
    const validTypes = ['text/csv', 'application/csv', 'text/plain']
    const validExtensions = ['.csv', '.txt']
    
    const hasValidType = validTypes.includes(file.type)
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    )
    
    if (!hasValidType && !hasValidExtension) {
      warnings.push('File type may not be CSV. Supported types: .csv, .txt')
    }

    resolve({
      isValid: errors.length === 0,
      errors,
      warnings,
      fileInfo: {
        size: file.size,
        name: file.name,
        type: file.type
      }
    })
  })
}
