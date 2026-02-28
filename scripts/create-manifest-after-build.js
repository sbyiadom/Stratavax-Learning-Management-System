const fs = require('fs');
const path = require('path');

console.log('🔧 Running post-build manifest fix...');

// Create the directory structure
const manifestDir = path.join(process.cwd(), '.next', 'server', 'app', '(dashboard)');
const manifestPath = path.join(manifestDir, 'page_client-reference-manifest.js');

console.log('📁 Checking for manifest at:', manifestPath);

// Ensure the directory exists
if (!fs.existsSync(manifestDir)) {
  console.log('📁 Creating directory:', manifestDir);
  fs.mkdirSync(manifestDir, { recursive: true });
}

// Create a basic manifest file structure
const manifestContent = `// Auto-generated manifest file
module.exports = {
  clientModules: [],
  ssrModules: [],
  page: 'app/(dashboard)/page'
};
`;

console.log('📄 Creating manifest file');
fs.writeFileSync(manifestPath, manifestContent);

// Verify the file was created
if (fs.existsSync(manifestPath)) {
  console.log('✅ Manifest file created successfully at:', manifestPath);
  
  // List directory contents for debugging
  const files = fs.readdirSync(manifestDir);
  console.log('📂 Directory contents:', files);
} else {
  console.error('❌ Failed to create manifest file');
}

console.log('✅ Post-build fix complete');
