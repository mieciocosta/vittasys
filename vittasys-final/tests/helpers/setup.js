// Load test environment (optional — gracefully ignores missing .env.test)
try {
  const path = require('path');
  const dotenv = require('dotenv');
  const result = dotenv.config({ path: path.join(__dirname, '..', '..', '.env.test') });
  if (result.error && !result.error.message.includes('ENOENT')) {
    console.warn('Test setup warning:', result.error.message);
  }
} catch (e) {
  // dotenv not available in CI — that's OK for unit tests
}
