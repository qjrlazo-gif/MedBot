/**
 * ML API Deployment Verification Script
 * 
 * Usage:
 *   node tools/verify-ml-deployment.js https://your-ml-api-url.onrender.com
 */

const API_URL = process.argv[2] || 'http://localhost:5001';

console.log('🔍 Verifying ML API Deployment...');
console.log(`📍 Target: ${API_URL}\n`);

async function testHealthCheck() {
  console.log('1️⃣  Testing /health endpoint...');
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    if (data.status === 'healthy' && data.model_loaded) {
      console.log('✅ Health check passed');
      console.log(`   Status: ${data.status}`);
      console.log(`   Model: ${data.model_loaded ? 'Loaded' : 'Not loaded'}\n`);
      return true;
    } else {
      console.log('❌ Health check failed');
      console.log(`   Response: ${JSON.stringify(data)}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ Health check failed');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

async function testPrediction() {
  console.log('2️⃣  Testing /predict endpoint...');
  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'bring morphine to ICU urgently'
      })
    });
    
    const data = await response.json();
    
    if (data.intent === 'delivery' && data.confidence > 0.5) {
      console.log('✅ Prediction test passed');
      console.log(`   Intent: ${data.intent}`);
      console.log(`   Confidence: ${(data.confidence * 100).toFixed(1)}%`);
      console.log(`   Supplies: ${data.supplies.join(', ')}`);
      console.log(`   Destination: ${data.destination || 'N/A'}`);
      console.log(`   Priority: ${data.priority}\n`);
      return true;
    } else {
      console.log('❌ Prediction test failed');
      console.log(`   Response: ${JSON.stringify(data)}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ Prediction test failed');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

async function testCORS() {
  console.log('3️⃣  Testing CORS headers...');
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'OPTIONS',
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    
    if (corsHeader === '*' || corsHeader) {
      console.log('✅ CORS configured correctly');
      console.log(`   Allow-Origin: ${corsHeader}\n`);
      return true;
    } else {
      console.log('⚠️  CORS headers not found (might cause browser issues)');
      console.log(`   This could be okay if proxy handles CORS\n`);
      return true; // Don't fail, just warn
    }
  } catch (error) {
    console.log('⚠️  CORS test skipped');
    console.log(`   Error: ${error.message}\n`);
    return true; // Don't fail on CORS check
  }
}

async function runTests() {
  console.log('═'.repeat(60));
  console.log('  ML API DEPLOYMENT VERIFICATION');
  console.log('═'.repeat(60));
  console.log();
  
  const healthOk = await testHealthCheck();
  const predictionOk = await testPrediction();
  const corsOk = await testCORS();
  
  console.log('═'.repeat(60));
  
  if (healthOk && predictionOk && corsOk) {
    console.log('✅ All tests passed! ML API is ready for production.\n');
    console.log('Next steps:');
    console.log('1. Update client/.env.production with:');
    console.log(`   VITE_ML_API_URL=${API_URL}`);
    console.log('2. Rebuild frontend: npm run build');
    console.log('3. Deploy: firebase deploy');
    console.log('═'.repeat(60));
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Check the output above.\n');
    console.log('Common issues:');
    console.log('- Service still starting (wait 30s and try again)');
    console.log('- Model file not deployed (check deployment logs)');
    console.log('- CORS not configured (check flask-cors installation)');
    console.log('═'.repeat(60));
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
