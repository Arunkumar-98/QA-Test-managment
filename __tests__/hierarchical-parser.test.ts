import { parseTextIntelligently } from '@/lib/utils'
import { parseHierarchicalTestCases } from '@/lib/hierarchical-parser'

describe('Hierarchical Test Case Parser', () => {
  describe('Format Detection', () => {
          it('should detect hierarchical format with high confidence', () => {
      const input = `1. BASIC FUNCTIONALITY TEST CASES
1.1 User Authentication
TC001: Verify user login with valid credentials
Expected Result: User is logged in and redirected to dashboard

TC002: Verify user login with invalid credentials
Expected Result: Error message displayed, login denied`

      const result = parseTextIntelligently(input)
      expect(result.format).toBe('hierarchical')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should detect hierarchical format with sections and subsections', () => {
      const input = `1. BASIC FUNCTIONALITY TEST CASES
1.1 User Authentication
TC001: Verify user login with valid credentials
Expected Result: User is logged in and redirected to dashboard

TC002: Verify user logout
Expected Result: User is logged out and redirected to login page

2. ADVANCED FEATURES
2.1 Profile Management
TC003: Update user profile picture
Expected Result: Profile picture updated and displayed correctly

TC004: Delete user profile picture
Expected Result: Profile picture removed and default avatar shown`

      const result = parseTextIntelligently(input)
      expect(result.format).toBe('hierarchical')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should detect hierarchical format with priority sections', () => {
      const input = `1. BASIC FUNCTIONALITY TEST CASES
1.1 User Authentication
TC001: Verify user login with valid credentials
Expected Result: User is logged in and redirected to dashboard

TC002: Verify user logout
Expected Result: User is logged out and redirected to login page

1.2 User Registration
TC003: Register new user
Expected Result: User account created successfully

TEST EXECUTION PRIORITY
P0 - Critical (Must Pass)
- TC001, TC002
P1 - High Priority
- TC003`

      const result = parseTextIntelligently(input)
      expect(result.format).toBe('hierarchical')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should not detect hierarchical format for regular text', () => {
      const input = `Login Test
Verify user can log in with valid credentials.
The system should authenticate the user and redirect to the dashboard.`

      const result = parseTextIntelligently(input)
      expect(result.format).not.toBe('hierarchical')
    })
  })

  describe('Test Case Parsing', () => {
    it('should parse test case ID and title', () => {
      const input = `1. BASIC FUNCTIONALITY TEST CASES
1.1 User Authentication
TC001: Verify user login with valid credentials
Expected Result: User is logged in and redirected to dashboard`

      const result = parseHierarchicalTestCases(input)
      expect(result.testCases[0].id).toBe('TC001')
      expect(result.testCases[0].title).toBe('Verify user login with valid credentials')
    })

    it('should parse section and subsection', () => {
      const input = `1. BASIC FUNCTIONALITY TEST CASES
1.1 User Authentication
TC001: Verify user login with valid credentials
Expected Result: User is logged in and redirected to dashboard`

      const result = parseHierarchicalTestCases(input)
      expect(result.testCases[0].section).toContain('BASIC FUNCTIONALITY TEST CASES')
      expect(result.testCases[0].subsection).toContain('User Authentication')
    })

    it('should parse expected result', () => {
      const input = `1. BASIC FUNCTIONALITY TEST CASES
1.1 User Authentication
TC001: Verify user login with valid credentials
Expected Result: User is logged in and redirected to dashboard`

      const result = parseHierarchicalTestCases(input)
      expect(result.testCases[0].expectedResult).toBe('User is logged in and redirected to dashboard')
    })

    it('should parse priority information', () => {
      const input = `1. BASIC FUNCTIONALITY TEST CASES
1.1 User Authentication
TC001: Verify user login with valid credentials
Expected Result: User is logged in and redirected to dashboard

TEST EXECUTION PRIORITY
P0 - Critical (Must Pass)
- TC001`

      const result = parseHierarchicalTestCases(input)
      expect(result.metadata.priorities['TC001']).toBe('High')
    })

    it('should parse automation recommendations', () => {
      const input = `1. BASIC FUNCTIONALITY TEST CASES
1.1 User Authentication
TC001: Verify user login with valid credentials
Expected Result: User is logged in and redirected to dashboard

AUTOMATION RECOMMENDATIONS
High Priority for Automation
- Basic login flow
- User authentication`

      const result = parseHierarchicalTestCases(input)
      expect(result.metadata.automationRecommendations['Basic login flow']).toBe('High')
      expect(result.metadata.automationRecommendations['User authentication']).toBe('High')
    })
  })
})