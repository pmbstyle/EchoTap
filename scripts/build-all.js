#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const platform = process.platform;
const arch = process.arch;

console.log(`🏗️ Building EchoTap for ${platform}-${arch}...`);

// Check prerequisites
function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  // Check Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
  } catch (error) {
    console.error('❌ Node.js not found. Please install Node.js 18+');
    process.exit(1);
  }

  // Check Python
  const pythonCmd = platform === 'win32' ? 'python' : 'python3';
  try {
    const pythonVersion = execSync(`${pythonCmd} --version`, { encoding: 'utf8' }).trim();
    console.log(`✅ Python: ${pythonVersion}`);
  } catch (error) {
    console.error(`❌ Python not found. Please install Python 3.8+ and ensure it's in PATH`);
    process.exit(1);
  }

  // Check if we have the required dependencies
  if (!fs.existsSync('package.json')) {
    console.error('❌ package.json not found. Please run this script from the project root.');
    process.exit(1);
  }

  if (!fs.existsSync('backend/requirements.txt')) {
    console.error('❌ backend/requirements.txt not found.');
    process.exit(1);
  }

  console.log('✅ All prerequisites met');
}

// Clean previous builds
function cleanBuild() {
  console.log('🧹 Cleaning previous builds...');
  
  const dirsToClean = ['dist', 'build/python'];
  
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        if (platform === 'win32') {
          execSync(`rmdir /s /q "${dir}"`, { stdio: 'ignore' });
        } else {
          execSync(`rm -rf "${dir}"`, { stdio: 'ignore' });
        }
        console.log(`  ✅ Cleaned ${dir}`);
      } catch (error) {
        console.warn(`  ⚠️ Could not clean ${dir}: ${error.message}`);
      }
    }
  });
}

// Build process
async function build() {
  try {
    // Check prerequisites
    checkPrerequisites();
    
    // Clean previous builds
    cleanBuild();
    
    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Build Python runtime
    console.log('🐍 Building Python runtime...');
    execSync('npm run build:python', { stdio: 'inherit' });
    
    // Build renderer
    console.log('🎨 Building renderer...');
    execSync('npm run build:renderer', { stdio: 'inherit' });
    
    // Build Electron app
    console.log('⚡ Building Electron app...');
    execSync('electron-builder', { stdio: 'inherit' });
    
    console.log('✅ Build completed successfully!');
    console.log('📁 Check the dist/ directory for the installer');
    
    // Show build results
    if (fs.existsSync('dist')) {
      const distContents = fs.readdirSync('dist');
      console.log('📦 Build artifacts:');
      distContents.forEach(file => {
        const filePath = path.join('dist', file);
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`  📄 ${file} (${size} MB)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run the build
build();
