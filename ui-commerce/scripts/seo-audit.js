/**
 * Complete SEO Audit Script
 * Run: node scripts/seo-audit.js
 * 
 * Performs comprehensive SEO checks:
 * - Technical SEO
 * - On-page SEO
 * - Structured Data
 * - Performance
 * - Security
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
const isLocal = BASE_URL.includes('localhost');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    }).on('error', reject);
  });
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let warnings = 0;

function test(name, passed, isWarning = false) {
  totalTests++;
  if (passed) {
    passedTests++;
    log(`✅ ${name}`, 'green');
  } else if (isWarning) {
    warnings++;
    log(`⚠️  ${name}`, 'yellow');
  } else {
    failedTests++;
    log(`❌ ${name}`, 'red');
  }
}

async function auditTechnicalSEO() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('📋 TECHNICAL SEO AUDIT', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
  
  // Sitemap
  log('Sitemap.xml:', 'cyan');
  try {
    const sitemap = await fetchURL(`${BASE_URL}/sitemap.xml`);
    test('Sitemap is accessible', sitemap.statusCode === 200);
    test('Sitemap is valid XML', sitemap.body.includes('<?xml') && sitemap.body.includes('<urlset'));
    
    const urlCount = (sitemap.body.match(/<url>/g) || []).length;
    test(`Sitemap has URLs (${urlCount} found)`, urlCount > 0);
  } catch (error) {
    test('Sitemap is accessible', false);
  }
  
  // Robots.txt
  log('\nRobots.txt:', 'cyan');
  try {
    const robots = await fetchURL(`${BASE_URL}/robots.txt`);
    test('Robots.txt is accessible', robots.statusCode === 200);
    
    if (!isLocal) {
      test('Robots.txt has sitemap reference', robots.body.includes('Sitemap:'));
      test('Robots.txt allows crawling', robots.body.includes('Allow:') || !robots.body.includes('Disallow: /'));
    } else {
      log('   ℹ️  Skipping production checks (local environment)', 'blue');
    }
  } catch (error) {
    test('Robots.txt is accessible', false);
  }
  
  // Manifest
  log('\nManifest.json:', 'cyan');
  try {
    const manifest = await fetchURL(`${BASE_URL}/manifest.json`);
    test('Manifest is accessible', manifest.statusCode === 200);
    
    const json = JSON.parse(manifest.body);
    test('Manifest has name', !!json.name);
    test('Manifest has icons', json.icons && json.icons.length > 0);
    test('Manifest has start_url', !!json.start_url);
  } catch (error) {
    test('Manifest is valid', false);
  }
}

async function auditOnPageSEO() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('📝 ON-PAGE SEO AUDIT', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
  
  try {
    const response = await fetchURL(BASE_URL);
    const html = response.body;
    
    // Meta tags
    log('Meta Tags:', 'cyan');
    test('Has title tag', /<title>.*?<\/title>/.test(html));
    test('Has meta description', /<meta\s+name="description"/.test(html));
    test('Has viewport meta', /<meta\s+name="viewport"/.test(html));
    test('Has charset meta', /<meta\s+(charset|charSet)/.test(html));
    
    // Open Graph
    log('\nOpen Graph:', 'cyan');
    test('Has OG title', /<meta\s+property="og:title"/.test(html));
    test('Has OG description', /<meta\s+property="og:description"/.test(html));
    test('Has OG image', /<meta\s+property="og:image"/.test(html));
    test('Has OG type', /<meta\s+property="og:type"/.test(html));
    test('Has OG url', /<meta\s+property="og:url"/.test(html));
    
    // Twitter Card
    log('\nTwitter Card:', 'cyan');
    test('Has Twitter card', /<meta\s+name="twitter:card"/.test(html));
    test('Has Twitter title', /<meta\s+name="twitter:title"/.test(html));
    test('Has Twitter image', /<meta\s+name="twitter:image"/.test(html));
    
    // Links
    log('\nLinks:', 'cyan');
    test('Has canonical URL', /<link\s+rel="canonical"/.test(html));
    test('Has manifest link', /<link\s+rel="manifest"/.test(html));
    test('Has favicon', /<link\s+rel="icon"/.test(html));
    
    // Title length
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch) {
      const titleLength = titleMatch[1].length;
      test(`Title length optimal (${titleLength} chars)`, titleLength >= 30 && titleLength <= 60, titleLength < 30 || titleLength > 60);
    }
    
    // Meta description length
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
    if (descMatch) {
      const descLength = descMatch[1].length;
      test(`Description length optimal (${descLength} chars)`, descLength >= 120 && descLength <= 160, descLength < 120 || descLength > 160);
    }
    
  } catch (error) {
    log(`Error: ${error.message}`, 'red');
  }
}

async function auditStructuredData() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('🔍 STRUCTURED DATA AUDIT', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
  
  try {
    const response = await fetchURL(BASE_URL);
    const html = response.body;
    
    const jsonLdMatches = html.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    
    test('Has structured data', !!jsonLdMatches && jsonLdMatches.length > 0);
    
    if (jsonLdMatches) {
      log(`   Found ${jsonLdMatches.length} JSON-LD blocks`, 'blue');
      
      const schemas = [];
      jsonLdMatches.forEach((match) => {
        try {
          const json = JSON.parse(match.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]);
          schemas.push(json['@type']);
        } catch (e) {
          // Ignore parse errors
        }
      });
      
      test('Has Organization schema', schemas.includes('Organization'));
      test('Has WebSite schema', schemas.includes('WebSite'));
      test('Has WebPage schema', schemas.includes('WebPage'));
      
      log(`   Schema types: ${schemas.join(', ')}`, 'blue');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'red');
  }
}

async function auditPerformance() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('⚡ PERFORMANCE AUDIT', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
  
  try {
    const startTime = Date.now();
    const response = await fetchURL(BASE_URL);
    const loadTime = Date.now() - startTime;
    
    test(`Page load time < 1s (${loadTime}ms)`, loadTime < 1000, loadTime >= 1000 && loadTime < 3000);
    
    const sizeKB = (response.body.length / 1024).toFixed(2);
    test(`Page size reasonable (${sizeKB} KB)`, parseFloat(sizeKB) < 500);
    
    // Check for compression
    test('Response is compressed', response.headers['content-encoding'] === 'gzip' || response.headers['content-encoding'] === 'br', true);
    
  } catch (error) {
    log(`Error: ${error.message}`, 'red');
  }
}

async function auditSecurity() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('🔒 SECURITY AUDIT', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
  
  try {
    const response = await fetchURL(BASE_URL);
    const headers = response.headers;
    
    test('Has X-Frame-Options', !!headers['x-frame-options']);
    test('Has X-Content-Type-Options', !!headers['x-content-type-options']);
    test('Has X-XSS-Protection', !!headers['x-xss-protection']);
    test('Has Referrer-Policy', !!headers['referrer-policy']);
    
    if (!isLocal) {
      test('Has HSTS', !!headers['strict-transport-security']);
      test('Uses HTTPS', BASE_URL.startsWith('https'));
    } else {
      log('   ℹ️  Skipping HTTPS checks (local environment)', 'blue');
    }
  } catch (error) {
    log(`Error: ${error.message}`, 'red');
  }
}

async function main() {
  log('\n╔═══════════════════════════════════════════╗', 'cyan');
  log('║       🔍 COMPLETE SEO AUDIT 🔍           ║', 'bold');
  log('╚═══════════════════════════════════════════╝\n', 'cyan');
  
  log(`Testing: ${BASE_URL}`, 'blue');
  if (isLocal) {
    log('Environment: Development (local)', 'yellow');
  } else {
    log('Environment: Production', 'green');
  }
  
  await auditTechnicalSEO();
  await auditOnPageSEO();
  await auditStructuredData();
  await auditPerformance();
  await auditSecurity();
  
  // Summary
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('📊 AUDIT SUMMARY', 'bold');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
  
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`✅ Passed: ${passedTests}`, 'green');
  log(`❌ Failed: ${failedTests}`, 'red');
  log(`⚠️  Warnings: ${warnings}`, 'yellow');
  
  const score = Math.round((passedTests / totalTests) * 100);
  log(`\n🎯 SEO Score: ${score}%`, score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red');
  
  if (score >= 90) {
    log('   Excellent! Your SEO is in great shape! 🎉', 'green');
  } else if (score >= 70) {
    log('   Good, but there\'s room for improvement. 👍', 'yellow');
  } else {
    log('   Needs work. Please address the failed tests. ⚠️', 'red');
  }
  
  log('\n📚 Resources:', 'blue');
  log('   • Google Rich Results Test: https://search.google.com/test/rich-results', 'blue');
  log('   • PageSpeed Insights: https://pagespeed.web.dev/', 'blue');
  log('   • Schema Validator: https://validator.schema.org/', 'blue');
  log('   • Mobile-Friendly Test: https://search.google.com/test/mobile-friendly\n', 'blue');
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

