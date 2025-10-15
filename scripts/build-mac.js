#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏗️ Building EchoTap for macOS...');

// Check if we're on macOS
if (process.platform !== 'darwin') {
  console.error('❌ This script should only be run on macOS');
  process.exit(1);
}

try {
  // Build Python runtime
  console.log('🐍 Building Python runtime...');
  execSync('npm run build:python', { stdio: 'inherit' });

  // Build renderer
  console.log('🎨 Building renderer...');
  execSync('npm run build:renderer', { stdio: 'inherit' });

  // Build Electron app
  console.log('⚡ Building Electron app...');
  execSync('electron-builder --mac', { stdio: 'inherit' });

  console.log('✅ macOS build completed successfully!');
  console.log('📁 Check the dist/ directory for the DMG');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
