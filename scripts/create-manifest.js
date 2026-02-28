const fs = require('fs');
const path = require('path');

// Create the directory structure
const manifestDir = path.join(process.cwd(), '.next', 'server', 'app', '(dashboard)');
const manifestPath = path.join(manifestDir, 'page_client-reference-manifest.js');

console.log('📁 Checking for manifest at:', manifestPath);

// Ensure the directory exists
if (!fs.existsSync(manifestDir)) {
  console.log('📁 Creating directory:', manifestDir);
  fs.mkdirSync(manifestDir, { recursive: true });
}

// Create an empty manifest file (it will be overwritten by Next.js)
if (!fs.existsSync(manifestPath)) {
  console.log('📄 Creating placeholder manifest file');
  fs.writeFileSync(manifestPath, '// Placeholder manifest file - will be overwritten by Next.js\n');
} else {
  console.log('✅ Manifest file already exists');
}

console.log('✅ Manifest setup complete');
