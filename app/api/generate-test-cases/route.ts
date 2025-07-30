import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/lib/supabase'

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

export async function POST(request: NextRequest) {
  try {
    // Debug environment variables
    console.log('🔍 Environment Check:')
    console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY)
    console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length)
    console.log('GEMINI_API_KEY starts with:', process.env.GEMINI_API_KEY?.substring(0, 10))
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('All env vars with GEMINI:', Object.keys(process.env).filter(key => key.includes('GEMINI')))
    
    // Check authentication (temporarily disabled for live deployment)
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized - Authentication required' },
    //     { status: 401 }
    //   )
    // }
    
    // For now, use a default user for live deployment
    const user = { email: 'live-deployment@example.com' }

    const { prdTitle, prdContent, project } = await request.json()

    if (!prdTitle || !prdContent) {
      return NextResponse.json(
        { error: 'PRD title and content are required' },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Rate limiting check (optional)
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    console.log(`Test case generation request from user ${user.email} (IP: ${clientIP})`)

    // Create a comprehensive prompt for test case generation
    const prompt = `
You are an expert QA engineer. Based on the following PRD/feature documentation, generate comprehensive test cases.

PRD Title: ${prdTitle}
Project: ${project}

PRD Content:
${prdContent}

Please generate 8-12 comprehensive test cases that cover:
1. Happy path scenarios
2. Edge cases
3. Error scenarios
4. Boundary conditions
5. Integration points
6. Security considerations
7. Performance aspects
8. Accessibility requirements

For each test case, provide:
- A clear, descriptive title
- Detailed test steps (numbered)
- Expected results
- Priority (High/Medium/Low)
- Category (Functional/Non-Functional/Regression/Smoke/Integration/Unit)

Format your response as a JSON array with the following structure:
[
  {
    "title": "Test case title",
    "description": "Brief description of what this test case covers",
    "steps": "1. Step one\\n2. Step two\\n3. Step three",
    "expectedResult": "Expected outcome after executing the steps",
    "priority": "High|Medium|Low",
    "category": "Functional|Non-Functional|Regression|Smoke|Integration|Unit"
  }
]

Ensure the test cases are:
- Specific and actionable
- Cover both positive and negative scenarios
- Include data validation where applicable
- Consider user experience aspects
- Address business requirements
- Include proper test data requirements

Return only the JSON array, no additional text or explanations.
`

    // Generate test cases using Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const generatedText = response.text()

    // Parse the JSON response
    let testCases
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        testCases = JSON.parse(jsonMatch[0])
      } else {
        testCases = JSON.parse(generatedText)
      }
    } catch (parseError) {
      console.error('Error parsing generated test cases:', parseError)
      console.log('Generated text:', generatedText)
      
      // Fallback: create a basic test case structure
      testCases = [
        {
          title: "Basic Functionality Test",
          description: "Test the basic functionality described in the PRD",
          steps: "1. Review the PRD requirements\n2. Identify key functionality\n3. Create test scenarios",
          expectedResult: "All basic functionality works as specified in the PRD",
          priority: "High",
          category: "Functional"
        }
      ]
    }

    // Validate and clean up the test cases
    const validatedTestCases = testCases.map((tc: any, index: number) => ({
      title: tc.title || `Test Case ${index + 1}`,
      description: tc.description || 'Test case description',
      steps: tc.steps || '1. Review requirements\n2. Execute test\n3. Verify results',
      expectedResult: tc.expectedResult || 'Expected results achieved',
      priority: ['High', 'Medium', 'Low'].includes(tc.priority) ? tc.priority : 'Medium',
      category: ['Functional', 'Non-Functional', 'Regression', 'Smoke', 'Integration', 'Unit'].includes(tc.category) ? tc.category : 'Functional'
    }))

    return NextResponse.json({
      success: true,
      testCases: validatedTestCases,
      count: validatedTestCases.length,
      project,
      prdTitle
    })

  } catch (error) {
    console.error('Error generating test cases:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate test cases',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 