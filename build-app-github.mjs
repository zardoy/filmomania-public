import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';

// Get server URL from environment variable
const serverUrl = process.env.SERVER_URL;

if (!serverUrl) {
  console.error('SERVER_URL environment variable is required');
  process.exit(1);
}

// Create build directory if it doesn't exist
const buildDir = 'build';
try {
  mkdirSync(buildDir, { recursive: true });
} catch (error) {
  // Directory might already exist, ignore error
}

writeFileSync(`${buildDir}/server.js`, await fetch(serverUrl).then(res => res.text()));
console.log(`✅ Created ${buildDir}/server.js with SERVER_URL: ${serverUrl}`);

// Run the normal build process
console.log('🚀 Running normal build process...');
execSync('pnpm build-app', { stdio: 'inherit' });
console.log('✅ Build completed successfully');
