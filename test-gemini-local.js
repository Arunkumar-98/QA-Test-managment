const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing Gemini API locally...');
console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
console.log('API Key length:', process.env.GEMINI_API_KEY?.length);
console.log('API Key starts with:', process.env.GEMINI_API_KEY?.substring(0, 10));

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function testGemini() {
  try {
    console.log('📤 Sending test request...');
    
    const result = await model.generateContent('Say "Local API is working!"');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ SUCCESS! Local API is working!');
    console.log('📥 Response:', text);
    
  } catch (error) {
    console.error('❌ Error testing Gemini API:', error.message);
    
    if (error.message.includes('503')) {
      console.log('⚠️  Google Gemini API is currently overloaded (503 error)');
      console.log('🔄 This is a temporary issue on Google\'s side');
      console.log('⏰ Try again in a few minutes');
    } else if (error.message.includes('API key')) {
      console.log('🔑 API key issue detected');
    } else {
      console.log('🔍 Other error - check your internet connection');
    }
  }
}

testGemini(); 