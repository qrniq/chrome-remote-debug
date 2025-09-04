#!/usr/bin/env node

/**
 * Chrome Remote Interface Connection Test
 * 
 * This script tests the nginx reverse proxy connection to headless Chrome
 * and captures a screenshot of a webpage via the Chrome DevTools Protocol.
 * 
 * Requirements:
 * - Chrome running in headless mode with remote debugging enabled
 * - nginx configured as reverse proxy for WebSocket connections
 * - chrome-remote-interface npm package
 * 
 * Usage:
 *   node test-connection.js [options]
 *   
 * Environment Variables:
 *   PROXY_HOST    - nginx proxy host (default: localhost)
 *   PROXY_PORT    - nginx proxy port (default: 80)
 *   TARGET_URL    - URL to capture screenshot (default: https://www.example.com)
 *   OUTPUT_FILE   - Screenshot filename (default: screenshot.png)
 *   CHROME_PORT   - Direct Chrome port for fallback (default: 48333)
 */

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');

// Configuration from environment or defaults
const config = {
    proxyHost: process.env.PROXY_HOST || '172.31.22.94',
    proxyPort: parseInt(process.env.PROXY_PORT) || 80,
    targetUrl: process.env.TARGET_URL || 'https://www.example.com',
    outputFile: process.env.OUTPUT_FILE || 'screenshot.png',
    chromePort: parseInt(process.env.CHROME_PORT) || 9223,
    timeout: 30000,
    useProxy: process.env.USE_DIRECT !== 'true'
};

// Logging utilities
const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);
const error = (message) => console.error(`[ERROR] ${message}`);
const warn = (message) => console.warn(`[WARN] ${message}`);

/**
 * Test direct connection to Chrome (bypass proxy)
 */
async function testDirectConnection() {
    log(`Testing direct connection to Chrome on port ${config.chromePort}...`);
    
    try {
        const client = await CDP({
            host: '172.31.21.39',
            port: config.chromePort,
            timeout: 5000
        });
        
        await client.close();
        log('Direct Chrome connection successful');
        return true;
    } catch (err) {
        error(`Direct Chrome connection failed: ${err.message}`);
        return false;
    }
}

/**
 * Test proxy connection
 */
async function testProxyConnection() {
    log(`Testing proxy connection via ${config.proxyHost}:${config.proxyPort}...`);
    
    try {
        // Test health endpoint
        const http = require('http');
        
        return new Promise((resolve, reject) => {
            const req = http.get(`http://${config.proxyHost}:${config.proxyPort}/health`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        log('Proxy health check successful');
                        resolve(true);
                    } else {
                        error(`Proxy health check failed with status: ${res.statusCode}`);
                        resolve(false);
                    }
                });
            });
            
            req.on('error', (err) => {
                error(`Proxy connection failed: ${err.message}`);
                resolve(false);
            });
            
            req.setTimeout(5000, () => {
                error('Proxy connection timeout');
                req.destroy();
                resolve(false);
            });
        });
    } catch (err) {
        error(`Proxy test error: ${err.message}`);
        return false;
    }
}


async function displayTargetsInfo() {
    try {
        log('Fetching Chrome targets information...');
        
        const targets = await CDP.List({
            host: config.useProxy ? config.proxyHost : 'localhost',
            port: config.useProxy ? config.proxyPort : config.chromePort
        });
        
        log(`Found ${targets.length} Chrome target(s):`);
        targets.forEach((target, index) => {
            log(`  Target ${index + 1}:`);
            log(`    ID: ${target.id}`);
            log(`    Type: ${target.type}`);
            log(`    URL: ${target.url}`);
            log(`    Title: ${target.title || 'N/A'}`);
            log(`    WebSocket: ${target.webSocketDebuggerUrl || 'N/A'}`);
        });
        
        return targets;
    } catch (err) {
        error(`Failed to fetch targets: ${err.message}`);
        return [];
    }
}

/**
 * Main execution function
 */
async function main() {
    log('Chrome Remote Interface Connection Test');
    log('=====================================');
    log(`Configuration:`);
    log(`  Proxy: ${config.proxyHost}:${config.proxyPort}`);
    log(`  Target URL: ${config.targetUrl}`);
    log(`  Output File: ${config.outputFile}`);
    log(`  Chrome Port: ${config.chromePort}`);
    log(`  Use Proxy: ${config.useProxy}`);
    log('');
    
    try {
        // Test connections
        const proxyHealthy = await testProxyConnection();
        const chromeReachable = await testDirectConnection();
        
        if (!chromeReachable) {
            error('Chrome is not reachable. Please ensure Chrome is running with remote debugging enabled.');
            error('Start Chrome with: ./start-chrome.sh');
            process.exit(1);
        }
        
        // Display targets information
        await displayTargetsInfo();
        
     
        
       
        
    
        
    } catch (err) {
        error(`Unexpected error: ${err.message}`);
        console.error(err.stack);
        process.exit(1);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log('Chrome Remote Interface Connection Test');
    console.log('');
    console.log('Usage: node test-connection.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --direct       Use direct Chrome connection (bypass proxy)');
    console.log('');
    console.log('Environment Variables:');
    console.log('  PROXY_HOST     nginx proxy host (default: localhost)');
    console.log('  PROXY_PORT     nginx proxy port (default: 80)');
    console.log('  TARGET_URL     URL to capture (default: https://www.example.com)');
    console.log('  OUTPUT_FILE    Screenshot filename (default: screenshot.png)');
    console.log('  CHROME_PORT    Direct Chrome port (default: 48333)');
    console.log('  USE_DIRECT     Set to "true" to bypass proxy');
    console.log('');
    console.log('Examples:');
    console.log('  node test-connection.js');
    console.log('  TARGET_URL=https://google.com node test-connection.js');
    console.log('  USE_DIRECT=true node test-connection.js');
    process.exit(0);
}

if (args.includes('--direct')) {
    config.useProxy = false;
    log('Direct mode enabled - bypassing proxy');
}

// Handle process signals
process.on('SIGINT', () => {
    log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Run main function
if (require.main === module) {
    main().catch((err) => {
        error(`Fatal error: ${err.message}`);
        console.error(err.stack);
        process.exit(1);
    });
}