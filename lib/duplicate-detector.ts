import { TestCase } from '@/types/qa-types'

export interface DuplicateDetectionOptions {
  fields: (keyof TestCase)[]
  similarity: number // 0-1, threshold for fuzzy matching
  caseSensitive: boolean
  trimWhitespace: boolean
}

export interface DuplicateGroup {
  original: Partial<TestCase>
  duplicates: Partial<TestCase>[]
  matchType: 'exact' | 'fuzzy'
  similarity: number
  matchedFields: string[]
}

export interface DuplicateDetectionResult {
  duplicateGroups: DuplicateGroup[]
  uniqueItems: Partial<TestCase>[]
  totalDuplicates: number
  summary: {
    exactMatches: number
    fuzzyMatches: number
    uniqueItems: number
  }
}

// Simple string similarity using Levenshtein distance
const calculateSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1
  if (str1.length === 0) return str2.length === 0 ? 1 : 0
  if (str2.length === 0) return 0

  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i] + 1,     // deletion
        matrix[j - 1][i - 1] + cost // substitution
      )
    }
  }

  const maxLength = Math.max(str1.length, str2.length)
  return 1 - matrix[str2.length][str1.length] / maxLength
}

// Normalize string for comparison
const normalizeString = (str: string, caseSensitive: boolean, trimWhitespace: boolean): string => {
  let normalized = str
  if (trimWhitespace) normalized = normalized.trim()
  if (!caseSensitive) normalized = normalized.toLowerCase()
  return normalized
}

// Compare two test cases for similarity
const compareTestCases = (
  item1: Partial<TestCase>,
  item2: Partial<TestCase>,
  options: DuplicateDetectionOptions
): { isMatch: boolean; similarity: number; matchedFields: string[] } => {
  const matchedFields: string[] = []
  let totalSimilarity = 0
  let fieldCount = 0

  for (const field of options.fields) {
    const value1 = item1[field]?.toString() || ''
    const value2 = item2[field]?.toString() || ''

    const normalized1 = normalizeString(value1, options.caseSensitive, options.trimWhitespace)
    const normalized2 = normalizeString(value2, options.caseSensitive, options.trimWhitespace)

    // For test case names, use exact match for better accuracy
    let similarity: number
    if (field === 'testCase') {
      similarity = normalized1 === normalized2 ? 1 : 0
    } else {
      similarity = calculateSimilarity(normalized1, normalized2)
    }

    totalSimilarity += similarity
    fieldCount++

    if (similarity >= options.similarity) {
      matchedFields.push(field as string)
    }
  }

  const averageSimilarity = fieldCount > 0 ? totalSimilarity / fieldCount : 0
  const isMatch = matchedFields.length > 0 && averageSimilarity >= options.similarity

  return {
    isMatch,
    similarity: averageSimilarity,
    matchedFields
  }
}

// Main duplicate detection function
export const detectDuplicates = (
  items: Partial<TestCase>[],
  options: Partial<DuplicateDetectionOptions> = {}
): DuplicateDetectionResult => {
  const defaultOptions: DuplicateDetectionOptions = {
    fields: ['testCase'], // Only compare test case names, not descriptions
    similarity: 0.95, // Much higher threshold for exact matches
    caseSensitive: false,
    trimWhitespace: true
  }

  const finalOptions = { ...defaultOptions, ...options }
  const duplicateGroups: DuplicateGroup[] = []
  const processedIndices = new Set<number>()

  for (let i = 0; i < items.length; i++) {
    if (processedIndices.has(i)) continue

    const currentItem = items[i]
    const duplicates: Partial<TestCase>[] = []

    for (let j = i + 1; j < items.length; j++) {
      if (processedIndices.has(j)) continue

      const comparison = compareTestCases(currentItem, items[j], finalOptions)
      
      if (comparison.isMatch) {
        duplicates.push(items[j])
        processedIndices.add(j)
      }
    }

    if (duplicates.length > 0) {
      const allSimilarities = duplicates.map(dup => 
        compareTestCases(currentItem, dup, finalOptions).similarity
      )
      const avgSimilarity = allSimilarities.reduce((a, b) => a + b, 0) / allSimilarities.length
      
      duplicateGroups.push({
        original: currentItem,
        duplicates,
        matchType: avgSimilarity === 1 ? 'exact' : 'fuzzy',
        similarity: avgSimilarity,
        matchedFields: finalOptions.fields.map(f => f as string)
      })
      processedIndices.add(i)
    }
  }

  const uniqueItems = items.filter((_, index) => !processedIndices.has(index))
  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.duplicates.length, 0)
  
  const exactMatches = duplicateGroups.filter(g => g.matchType === 'exact').length
  const fuzzyMatches = duplicateGroups.filter(g => g.matchType === 'fuzzy').length

  return {
    duplicateGroups,
    uniqueItems,
    totalDuplicates,
    summary: {
      exactMatches,
      fuzzyMatches,
      uniqueItems: uniqueItems.length
    }
  }
}

// Merge duplicate test cases with conflict resolution
export const mergeDuplicates = (
  group: DuplicateGroup,
  strategy: 'keep_first' | 'keep_last' | 'merge_fields' | 'manual' = 'keep_first'
): Partial<TestCase> => {
  const allItems = [group.original, ...group.duplicates]
  
  switch (strategy) {
    case 'keep_first':
      return group.original

    case 'keep_last':
      return group.duplicates[group.duplicates.length - 1]

    case 'merge_fields': {
      const merged: Partial<TestCase> = { ...group.original }
      
      // Merge non-empty fields from duplicates
      for (const duplicate of group.duplicates) {
        Object.entries(duplicate).forEach(([key, value]) => {
          if (value && (!merged[key as keyof TestCase] || merged[key as keyof TestCase] === '')) {
            (merged as any)[key] = value
          }
        })
      }
      
      return merged
    }

    default:
      return group.original
  }
}

// Generate duplicate resolution suggestions
export const generateResolutionSuggestions = (
  group: DuplicateGroup
): Array<{
  strategy: string
  description: string
  result: Partial<TestCase>
}> => {
  return [
    {
      strategy: 'keep_first',
      description: 'Keep the first occurrence and discard duplicates',
      result: mergeDuplicates(group, 'keep_first')
    },
    {
      strategy: 'keep_last',
      description: 'Keep the last occurrence and discard others',
      result: mergeDuplicates(group, 'keep_last')
    },
    {
      strategy: 'merge_fields',
      description: 'Merge all non-empty fields from all duplicates',
      result: mergeDuplicates(group, 'merge_fields')
    }
  ]
}
