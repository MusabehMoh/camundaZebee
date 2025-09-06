// Test script for enhanced leave approval process
const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testEnhancedProcess() {
  console.log('🧪 Testing Enhanced Leave Approval Process\n');

  // Test cases
  const testCases = [
    {
      name: 'Short Personal Leave (Auto-approval)',
      data: {
        requester: 'John Doe',
        leaveType: 'personal',
        days: 2,
        startDate: '2025-09-10',
        endDate: '2025-09-11',
        reason: 'Personal matters'
      }
    },
    {
      name: 'Medium Vacation (Manager approval)',
      data: {
        requester: 'Jane Smith',
        leaveType: 'vacation',
        days: 7,
        startDate: '2025-09-15',
        endDate: '2025-09-21',
        reason: 'Annual vacation with family'
      }
    },
    {
      name: 'Long Medical Leave (Manager + HR approval)',
      data: {
        requester: 'Bob Wilson',
        leaveType: 'medical',
        days: 15,
        startDate: '2025-09-20',
        endDate: '2025-10-04',
        reason: 'Medical procedure and recovery'
      }
    },
    {
      name: 'Invalid Leave (Validation failure)',
      data: {
        requester: 'Alice Brown',
        leaveType: 'invalid-type',
        days: 0,
        startDate: '',
        endDate: '',
        reason: 'Testing validation'
      }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📋 Testing: ${testCase.name}`);
      console.log(`Data:`, testCase.data);
      
      const response = await axios.post(`${BASE_URL}/api/start-process`, testCase.data);
      
      console.log(`✅ Response:`, response.data);
      
      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`❌ Error:`, error.response?.data || error.message);
    }
  }

  // Check pending tasks
  try {
    console.log('\n📝 Checking pending tasks...');
    const tasksResponse = await axios.get(`${BASE_URL}/api/tasks`);
    console.log(`Found ${tasksResponse.data.length} pending tasks:`);
    tasksResponse.data.forEach((task, index) => {
      console.log(`${index + 1}. ${task.variables.requester} - ${task.variables.days} days (${task.role || 'unknown'} approval)`);
    });
  } catch (error) {
    console.log('❌ Error fetching tasks:', error.message);
  }
}

// Run tests
testEnhancedProcess().catch(console.error);
