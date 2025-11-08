/**
 * Validate Structured Data (JSON-LD)
 * Run: node scripts/validate-structured-data.js
 */

const http = require('http');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function extractJSONLD(html) {
  const regex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  const matches = [];
  let match;
  
  while ((match = regex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      matches.push(json);
    } catch (e) {
      log(`⚠️  Failed to parse JSON-LD: ${e.message}`, 'yellow');
    }
  }
  
  return matches;
}

function validateSchema(schema, schemaType) {
  const errors = [];
  const warnings = [];
  
  // Check @context
  if (!schema['@context']) {
    errors.push('Missing @context');
  } else if (schema['@context'] !== 'https://schema.org') {
    warnings.push(`@context should be "https://schema.org", got "${schema['@context']}"`);
  }
  
  // Check @type
  if (!schema['@type']) {
    errors.push('Missing @type');
  }
  
  // Type-specific validation
  switch (schema['@type']) {
    case 'Organization':
      if (!schema.name) errors.push('Organization missing name');
      if (!schema.url) errors.push('Organization missing url');
      if (!schema.logo) warnings.push('Organization missing logo');
      break;
      
    case 'WebSite':
      if (!schema.name) errors.push('WebSite missing name');
      if (!schema.url) errors.push('WebSite missing url');
      break;
      
    case 'WebPage':
      if (!schema.name) warnings.push('WebPage missing name');
      if (!schema.url) warnings.push('WebPage missing url');
      break;
      
    case 'Product':
      if (!schema.name) errors.push('Product missing name');
      if (!schema.image) errors.push('Product missing image');
      if (!schema.offers) errors.push('Product missing offers');
      if (schema.offers && !schema.offers.price) {
        errors.push('Product offers missing price');
      }
      break;
      
    case 'BreadcrumbList':
      if (!schema.itemListElement) {
        errors.push('BreadcrumbList missing itemListElement');
      } else if (!Array.isArray(schema.itemListElement)) {
        errors.push('BreadcrumbList itemListElement should be an array');
      }
      break;
      
    case 'CollectionPage':
      if (!schema.name) warnings.push('CollectionPage missing name');
      break;
  }
  
  return { errors, warnings };
}

async function testPage(url, pageName) {
  log(`\n📄 Testing ${pageName}...`, 'cyan');
  log(`   URL: ${url}`, 'blue');
  
  try {
    const html = await fetchURL(url);
    const schemas = extractJSONLD(html);
    
    if (schemas.length === 0) {
      log('   ❌ No structured data found', 'red');
      return;
    }
    
    log(`   ✅ Found ${schemas.length} JSON-LD schema(s)`, 'green');
    
    schemas.forEach((schema, index) => {
      const schemaType = schema['@type'];
      log(`\n   Schema ${index + 1}: ${schemaType}`, 'magenta');
      
      const { errors, warnings } = validateSchema(schema, schemaType);
      
      if (errors.length === 0 && warnings.length === 0) {
        log('      ✅ Valid schema', 'green');
      } else {
        if (errors.length > 0) {
          errors.forEach(error => {
            log(`      ❌ ${error}`, 'red');
          });
        }
        if (warnings.length > 0) {
          warnings.forEach(warning => {
            log(`      ⚠️  ${warning}`, 'yellow');
          });
        }
      }
      
      // Show key properties
      const keyProps = ['name', 'url', 'description', 'image', 'price'];
      const foundProps = keyProps.filter(prop => schema[prop]);
      
      if (foundProps.length > 0) {
        log(`      Properties: ${foundProps.join(', ')}`, 'blue');
      }
    });
    
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
  }
}

async function main() {
  log('🔍 Validating Structured Data (JSON-LD)...', 'cyan');
  log(`   Base URL: ${BASE_URL}\n`, 'blue');
  
  // Test pages
  const pages = [
    { url: `${BASE_URL}/`, name: 'Homepage' },
    { url: `${BASE_URL}/products`, name: 'Products Page' },
    { url: `${BASE_URL}/about`, name: 'About Page' },
  ];
  
  for (const page of pages) {
    await testPage(page.url, page.name);
  }
  
  log('\n✨ Validation Complete!', 'cyan');
  log('\n📊 Next Steps:', 'blue');
  log('   1. Fix any ❌ errors', 'blue');
  log('   2. Consider fixing ⚠️  warnings', 'blue');
  log('   3. Test with Google Rich Results Test:', 'blue');
  log('      https://search.google.com/test/rich-results', 'blue');
  log('   4. Validate with Schema.org validator:', 'blue');
  log('      https://validator.schema.org/', 'blue');
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

