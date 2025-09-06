import { TestCase, TestCaseStatus, TestCasePriority, TestCaseCategory } from "@/types/qa-types"

interface HierarchicalTestCase {
  id: string
  title: string
  section: string
  subsection: string
  expectedResult: string
  description?: string
  priority?: TestCasePriority
  status?: TestCaseStatus
  category?: TestCaseCategory
  automationStatus?: string
  stepsToReproduce?: string
}

interface ParsedHierarchicalData {
  testCases: HierarchicalTestCase[]
  sections: {
    [key: string]: {
      title: string
      subsections: {
        [key: string]: {
          title: string
          testCases: HierarchicalTestCase[]
        }
      }
    }
  }
  metadata: {
    priorities: { [key: string]: TestCasePriority }
    automationRecommendations: { [key: string]: string }
  }
}

export function parseHierarchicalTestCases(text: string): ParsedHierarchicalData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line)
  const result: ParsedHierarchicalData = {
    testCases: [],
    sections: {},
    metadata: {
      priorities: {},
      automationRecommendations: {}
    }
  }

  let currentSection = ''
  let currentSubsection = ''
  let currentTestCase: Partial<HierarchicalTestCase> | null = null
  let inPrioritySection = false
  let inAutomationSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Skip empty lines
    if (!line.trim()) continue

    // Check for main sections (e.g., "1. BASIC FUNCTIONALITY TEST CASES")
    if (/^\d+\.\s+[A-Z][A-Z\s]+$/.test(line)) {
      currentSection = line
      currentSubsection = ''
      if (!result.sections[currentSection]) {
        result.sections[currentSection] = {
          title: line.replace(/^\d+\.\s+/, ''),
          subsections: {}
        }
      }
      continue
    }

    // Check for subsections (e.g., "1.1 Ride Booking Initiation")
    if (/^\d+\.\d+\s+[A-Z]/.test(line)) {
      currentSubsection = line
      if (!result.sections[currentSection].subsections[currentSubsection]) {
        result.sections[currentSection].subsections[currentSubsection] = {
          title: line.replace(/^\d+\.\d+\s+/, ''),
          testCases: []
        }
      }
      continue
    }

    // Check for test case ID (e.g., "TC001: ")
    if (/^TC\d{3}:/.test(line)) {
      if (currentTestCase) {
        result.testCases.push(currentTestCase as HierarchicalTestCase)
      }

      const [id, ...titleParts] = line.split(':')
      currentTestCase = {
        id: id.trim(),
        title: titleParts.join(':').trim(),
        section: currentSection,
        subsection: currentSubsection
      }
      continue
    }

    // Check for expected result
    if (line.startsWith('Expected Result:')) {
      if (currentTestCase) {
        currentTestCase.expectedResult = line.replace('Expected Result:', '').trim()
        
        // Add the completed test case
        result.testCases.push(currentTestCase as HierarchicalTestCase)
        
        // If there are test cases in the current subsection, add it there too
        if (currentSection && currentSubsection && 
            result.sections[currentSection]?.subsections[currentSubsection]) {
          result.sections[currentSection].subsections[currentSubsection].testCases.push(
            currentTestCase as HierarchicalTestCase
          )
        }
        
        currentTestCase = null
      }
      continue
    }

    // Check for priority section
    if (line === 'TEST EXECUTION PRIORITY') {
      inPrioritySection = true
      inAutomationSection = false
      continue
    }

    // Check for automation section
    if (line === 'AUTOMATION RECOMMENDATIONS') {
      inPrioritySection = false
      inAutomationSection = true
      continue
    }

    // Parse priority information
    if (inPrioritySection) {
      // Handle priority headers (e.g., "P0 - Critical (Must Pass)")
      if (line.startsWith('P')) {
        const [priority, description] = line.split('-').map(s => s.trim())
        const normalizedPriority = normalizePriority(priority)
        
        // Look ahead for test case references
        let i = lines.indexOf(line) + 1
        while (i < lines.length && lines[i].trim().startsWith('-')) {
          const testCaseRefs = lines[i].replace('-', '').trim()
          const matches = testCaseRefs.match(/TC\d{3}/g)
          if (matches) {
            matches.forEach(tcId => {
              result.metadata.priorities[tcId] = normalizedPriority
            })
          }
          i++
        }
      }
      continue
    }

    // Parse automation recommendations
    if (inAutomationSection && line.startsWith('High Priority for Automation')) {
      const recommendations = lines.slice(i + 1)
        .takeWhile(l => l.startsWith('-'))
        .map(l => l.replace('-', '').trim())
      
      recommendations.forEach(rec => {
        result.metadata.automationRecommendations[rec] = 'High'
      })
      continue
    }

    // If we're in a test case, append to description
    if (currentTestCase && !line.startsWith('Expected Result:')) {
      currentTestCase.description = currentTestCase.description 
        ? currentTestCase.description + ' ' + line
        : line
    }
  }

  // Add the last test case if any
  if (currentTestCase) {
    result.testCases.push(currentTestCase as HierarchicalTestCase)
    if (currentSection && currentSubsection && 
        result.sections[currentSection]?.subsections[currentSubsection]) {
      result.sections[currentSection].subsections[currentSubsection].testCases.push(
        currentTestCase as HierarchicalTestCase
      )
    }
  }

  // Apply priorities and automation status to test cases
  result.testCases = result.testCases.map(tc => ({
    ...tc,
    priority: result.metadata.priorities[tc.id] || 'Medium',
    automationStatus: determineAutomationStatus(tc, result.metadata.automationRecommendations)
  }))

  return result
}

function normalizePriority(priority: string): TestCasePriority {
  const priorityMap: { [key: string]: TestCasePriority } = {
    'P0': 'P0 (Blocker)',
    'P1': 'P1 (High)',
    'P2': 'P2 (Medium)',
    'P3': 'P3 (Low)'
  }
  return priorityMap[priority] || 'P2 (Medium)'
}

function determineAutomationStatus(
  testCase: HierarchicalTestCase,
  recommendations: { [key: string]: string }
): string {
  // Check if any recommendation keywords match the test case title or description
  const testCaseText = `${testCase.title} ${testCase.description || ''}`.toLowerCase()
  
  for (const [recommendation, priority] of Object.entries(recommendations)) {
    if (testCaseText.includes(recommendation.toLowerCase())) {
      return priority
    }
  }

  return 'Not Prioritized'
}

// Helper extension
declare global {
  interface Array<T> {
    takeWhile(predicate: (value: T) => boolean): T[]
  }
}

if (!Array.prototype.takeWhile) {
  Array.prototype.takeWhile = function<T>(predicate: (value: T) => boolean): T[] {
    const result: T[] = []
    for (const item of this) {
      if (predicate(item)) {
        result.push(item)
      } else {
        break
      }
    }
    return result
  }
}