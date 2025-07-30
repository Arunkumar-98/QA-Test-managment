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
    console.log('NODE_ENV:', process.env.NODE_ENV)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    const { testCaseContent, project } = await request.json()

    if (!testCaseContent) {
      return NextResponse.json(
        { error: 'Test case content is required' },
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
    console.log(`AI enhancement request from user ${user.email} (IP: ${clientIP})`)

    // Create a comprehensive prompt for test case enhancement
    const prompt = `
You are an expert QA engineer. Please enhance and format the following test case content to make it more professional, clear, and well-structured.

Project: ${project}

Original Test Case Content:
${testCaseContent}

Please enhance this test case by:

1. **Improving Grammar and Clarity**: Fix any grammatical errors, improve sentence structure, and make the language more professional
2. **Better Structure**: Ensure the test case follows a clear, logical structure
3. **Enhanced Descriptions**: Make descriptions more detailed and specific
4. **Professional Language**: Use professional QA terminology
5. **Clear Steps**: Ensure test steps are numbered, clear, and actionable
6. **Comprehensive Expected Results**: Make expected results more detailed and measurable
7. **Proper Formatting**: Ensure consistent formatting throughout

The enhanced test case should follow this structure:
- Clear, descriptive title
- Detailed description of what is being tested
- Numbered, clear test steps
- Detailed expected results
- Appropriate priority and status (if mentioned)

Return only the enhanced test case content, maintaining the same general structure but with improvements in grammar, clarity, and professionalism.
`

    // Enhance test case using Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const enhancedContent = response.text()

    return NextResponse.json({
      success: true,
      enhancedContent: enhancedContent.trim(),
      project,
      originalLength: testCaseContent.length,
      enhancedLength: enhancedContent.length
    })

  } catch (error) {
    console.error('Error enhancing test case:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to enhance test case',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 