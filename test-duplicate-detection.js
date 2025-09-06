// Test script to verify duplicate detection is working correctly
const { detectDuplicates } = require('./lib/duplicate-detector.ts');

// Sample test cases that should NOT be flagged as duplicates
const testCases = [
  {
    testCase: 'TC001',
    description: 'Verify user login functionality',
    status: 'Pass',
    priority: 'P1 (High)'
  },
  {
    testCase: 'TC002', 
    description: 'Verify user logout functionality',
    status: 'Pass',
    priority: 'P2 (Medium)'
  },
  {
    testCase: 'TC003',
    description: 'Verify password reset functionality', 
    status: 'Not Executed',
    priority: 'P2 (Medium)'
  },
  {
    testCase: 'TC001', // This should be flagged as duplicate
    description: 'Verify user login functionality',
    status: 'Pass',
    priority: 'P1 (High)'
  }
];

console.log('Testing duplicate detection...');
const result = detectDuplicates(testCases);

console.log('Results:');
console.log('- Duplicate groups:', result.duplicateGroups.length);
console.log('- Unique items:', result.uniqueItems.length);
console.log('- Total duplicates:', result.totalDuplicates);

if (result.duplicateGroups.length > 0) {
  console.log('\nDuplicate groups found:');
  result.duplicateGroups.forEach((group, index) => {
    console.log(`Group ${index + 1}:`);
    console.log(`- Original: ${group.original.testCase}`);
    console.log(`- Duplicates: ${group.duplicates.map(d => d.testCase).join(', ')}`);
    console.log(`- Similarity: ${(group.similarity * 100).toFixed(1)}%`);
  });
} else {
  console.log('\n✅ No false duplicates detected!');
}
