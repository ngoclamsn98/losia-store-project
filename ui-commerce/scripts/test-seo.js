/**
 * SEO Testing Script
 * Run: node scripts/test-seo.js
 * 
 * Tests:
 * - Sitemap accessibility
 * - Robots.txt
 * - Manifest.json
 * - Meta tags
 * - Structured data
 * - Performance
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const isLocal = BASE_URL.includes('localhost');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testSitemap() {
  log('\n📄 Testing Sitemap...', 'cyan');
  
  try {
    const url = `${BASE_URL}/sitemap.xml`;
    const response = await fetchURL(url);
    
    if (response.statusCode === 200) {
      log('✅ Sitemap is accessible', 'green');
      
      // Check if it's valid XML
      if (response.body.includes('<?xml') && response.body.includes('<urlset')) {
        log('✅ Sitemap has valid XML structure', 'green');
        
        // Count URLs
        const urlCount = (response.body.match(/<url>/g) || []).length;
        log(`✅ Sitemap contains ${urlCount} URLs`, 'green');
      } else {
        log('❌ Sitemap XML structure is invalid', 'red');
      }
    } else {
      log(`❌ Sitemap returned status ${response.statusCode}`, 'red');
    }
  } catch (error) {
    log(`❌ Error fetching sitemap: ${error.message}`, 'red');
  }
}

async function testRobots() {
  log('\n🤖 Testing Robots.txt...', 'cyan');
  
  try {
    const url = `${BASE_URL}/robots.txt`;
    const response = await fetchURL(url);
    
    if (response.statusCode === 200) {
      log('✅ Robots.txt is accessible', 'green');
      
      // Check for sitemap reference
      if (response.body.includes('Sitemap:')) {
        log('✅ Robots.txt includes sitemap reference', 'green');
      } else {
        log('⚠️  Robots.txt missing sitemap reference', 'yellow');
      }
      
      // Check for User-agent
      if (response.body.includes('User-agent:')) {
        log('✅ Robots.txt has User-agent directive', 'green');
      } else {
        log('❌ Robots.txt missing User-agent directive', 'red');
      }
    } else {
      log(`❌ Robots.txt returned status ${response.statusCode}`, 'red');
    }
  } catch (error) {
    log(`❌ Error fetching robots.txt: ${error.message}`, 'red');
  }
}

async function testManifest() {
  log('\n📱 Testing Manifest.json...', 'cyan');
  
  try {
    const url = `${BASE_URL}/manifest.json`;
    const response = await fetchURL(url);
    
    if (response.statusCode === 200) {
      log('✅ Manifest.json is accessible', 'green');
      
      try {
        const manifest = JSON.parse(response.body);
        
        // Check required fields
        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
        const missingFields = requiredFields.filter(field => !manifest[field]);
        
        if (missingFields.length === 0) {
          log('✅ Manifest has all required fields', 'green');
        } else {
          log(`⚠️  Manifest missing fields: ${missingFields.join(', ')}`, 'yellow');
        }
        
        // Check icons
        if (manifest.icons && manifest.icons.length > 0) {
          log(`✅ Manifest has ${manifest.icons.length} icons`, 'green');
        } else {
          log('❌ Manifest has no icons', 'red');
        }
      } catch (parseError) {
        log('❌ Manifest.json is not valid JSON', 'red');
      }
    } else {
      log(`❌ Manifest.json returned status ${response.statusCode}`, 'red');
    }
  } catch (error) {
    log(`❌ Error fetching manifest.json: ${error.message}`, 'red');
  }
}

async function testHomepage() {
  log('\n🏠 Testing Homepage Meta Tags...', 'cyan');
  
  try {
    const url = BASE_URL;
    const response = await fetchURL(url);
    
    if (response.statusCode === 200) {
      log('✅ Homepage is accessible', 'green');
      
      const html = response.body;
      
      // Check meta tags
      const checks = [
        { name: 'Title tag', regex: /<title>.*?<\/title>/ },
        { name: 'Meta description', regex: /<meta\s+name="description"/ },
        { name: 'Open Graph title', regex: /<meta\s+property="og:title"/ },
        { name: 'Open Graph image', regex: /<meta\s+property="og:image"/ },
        { name: 'Twitter card', regex: /<meta\s+name="twitter:card"/ },
        { name: 'Canonical URL', regex: /<link\s+rel="canonical"/ },
        { name: 'Manifest link', regex: /<link\s+rel="manifest"/ },
        { name: 'Favicon', regex: /<link\s+rel="icon"/ },
      ];
      
      checks.forEach(({ name, regex }) => {
        if (regex.test(html)) {
          log(`✅ ${name} found`, 'green');
        } else {
          log(`❌ ${name} missing`, 'red');
        }
      });
      
      // Check for structured data
      if (html.includes('application/ld+json')) {
        log('✅ Structured data (JSON-LD) found', 'green');
        
        // Count structured data blocks
        const jsonLdCount = (html.match(/application\/ld\+json/g) || []).length;
        log(`   Found ${jsonLdCount} JSON-LD blocks`, 'blue');
      } else {
        log('❌ No structured data found', 'red');
      }
    } else {
      log(`❌ Homepage returned status ${response.statusCode}`, 'red');
    }
  } catch (error) {
    log(`❌ Error fetching homepage: ${error.message}`, 'red');
  }
}

async function testSecurityHeaders() {
  log('\n🔒 Testing Security Headers...', 'cyan');
  
  try {
    const url = BASE_URL;
    const response = await fetchURL(url);
    
    const headers = response.headers;
    
    const securityHeaders = [
      { name: 'X-Frame-Options', header: 'x-frame-options' },
      { name: 'X-Content-Type-Options', header: 'x-content-type-options' },
      { name: 'X-XSS-Protection', header: 'x-xss-protection' },
      { name: 'Referrer-Policy', header: 'referrer-policy' },
      { name: 'Strict-Transport-Security', header: 'strict-transport-security' },
    ];
    
    securityHeaders.forEach(({ name, header }) => {
      if (headers[header]) {
        log(`✅ ${name}: ${headers[header]}`, 'green');
      } else {
        log(`⚠️  ${name} not set`, 'yellow');
      }
    });
  } catch (error) {
    log(`❌ Error checking security headers: ${error.message}`, 'red');
  }
}

async function testPerformance() {
  log('\n⚡ Testing Performance...', 'cyan');
  
  try {
    const url = BASE_URL;
    const startTime = Date.now();
    const response = await fetchURL(url);
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    
    if (loadTime < 1000) {
      log(`✅ Page load time: ${loadTime}ms (Excellent)`, 'green');
    } else if (loadTime < 3000) {
      log(`⚠️  Page load time: ${loadTime}ms (Good)`, 'yellow');
    } else {
      log(`❌ Page load time: ${loadTime}ms (Needs improvement)`, 'red');
    }
    
    // Check content size
    const sizeKB = (response.body.length / 1024).toFixed(2);
    log(`   Page size: ${sizeKB} KB`, 'blue');
    
  } catch (error) {
    log(`❌ Error testing performance: ${error.message}`, 'red');
  }
}

async function main() {
  log('🚀 Starting SEO Tests...', 'cyan');
  log(`   Testing URL: ${BASE_URL}`, 'blue');
  
  if (isLocal) {
    log('   ⚠️  Testing local development server', 'yellow');
    log('   Make sure the dev server is running (npm run dev)', 'yellow');
  }
  
  await testSitemap();
  await testRobots();
  await testManifest();
  await testHomepage();
  await testSecurityHeaders();
  await testPerformance();
  
  log('\n✨ SEO Tests Complete!', 'cyan');
  log('\n📊 Next Steps:', 'blue');
  log('   1. Fix any ❌ errors found above', 'blue');
  log('   2. Test with Google Rich Results Test:', 'blue');
  log('      https://search.google.com/test/rich-results', 'blue');
  log('   3. Test with PageSpeed Insights:', 'blue');
  log('      https://pagespeed.web.dev/', 'blue');
  log('   4. Validate structured data:', 'blue');
  log('      https://validator.schema.org/', 'blue');
}

// Run tests
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

