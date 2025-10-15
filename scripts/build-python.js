#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const platform = process.platform;
const arch = process.arch;

console.log(`🐍 Building Python runtime for ${platform}-${arch}...`);

// Create build directory
const buildDir = path.join(__dirname, '..', 'build', 'python');
const backendDir = path.join(__dirname, '..', 'backend');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Platform-specific Python executable names
const pythonExecutables = {
  win32: 'python.exe',
  darwin: 'python3',
  linux: 'python3'
};

const pythonExe = pythonExecutables[platform] || 'python3';

try {
  // Check if Python is available
  execSync(`${pythonExe} --version`, { stdio: 'pipe' });
  console.log('✅ Python found');
} catch (error) {
  console.error('❌ Python not found. Please install Python 3.8+ and ensure it\'s in PATH');
  process.exit(1);
}

// Create a standalone Python environment
const venvPath = path.join(buildDir, 'venv');

console.log('📦 Creating Python virtual environment...');
try {
  execSync(`${pythonExe} -m venv "${venvPath}"`, { stdio: 'inherit' });
  console.log('✅ Virtual environment created');
} catch (error) {
  console.error('❌ Failed to create virtual environment:', error.message);
  process.exit(1);
}

// Get the Python executable path in the venv
const venvPython = platform === 'win32' 
  ? path.join(venvPath, 'Scripts', 'python.exe')
  : path.join(venvPath, 'bin', 'python');

// Upgrade pip
console.log('⬆️ Upgrading pip...');
try {
  execSync(`"${venvPython}" -m pip install --upgrade pip`, { stdio: 'inherit' });
} catch (error) {
  console.warn('⚠️ Failed to upgrade pip:', error.message);
}

// Install dependencies
console.log('📚 Installing Python dependencies...');
const requirementsPath = path.join(backendDir, 'requirements.txt');

if (fs.existsSync(requirementsPath)) {
  try {
    execSync(`"${venvPython}" -m pip install -r "${requirementsPath}"`, { 
      stdio: 'inherit',
      cwd: backendDir
    });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.error('❌ requirements.txt not found');
  process.exit(1);
}

// Copy backend files
console.log('📋 Copying backend files...');
const backendFiles = [
  'main.py',
  'audio_capture.py',
  'transcription_engine.py',
  'database.py',
  'models.py',
  'multi_source_capture.py',
  'device_manager.py'
];

const backendDest = path.join(buildDir, 'backend');
if (!fs.existsSync(backendDest)) {
  fs.mkdirSync(backendDest, { recursive: true });
}

backendFiles.forEach(file => {
  const srcPath = path.join(backendDir, file);
  const destPath = path.join(backendDest, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✅ Copied ${file}`);
  } else {
    console.warn(`  ⚠️ File not found: ${file}`);
  }
});

// Copy internal directory if it exists
const internalSrc = path.join(backendDir, 'internal');
const internalDest = path.join(backendDest, 'internal');

if (fs.existsSync(internalSrc)) {
  console.log('📁 Copying internal directory...');
  copyDirectory(internalSrc, internalDest);
}

// Create Python launcher script
console.log('🚀 Creating Python launcher...');
const launcherContent = createLauncherScript(platform, venvPython);
const launcherPath = path.join(buildDir, platform === 'win32' ? 'run_backend.bat' : 'run_backend.sh');
fs.writeFileSync(launcherPath, launcherContent);

// Make executable on Unix systems
if (platform !== 'win32') {
  fs.chmodSync(launcherPath, '755');
}

console.log('✅ Python build completed successfully!');
console.log(`📁 Build directory: ${buildDir}`);
console.log(`🐍 Python executable: ${venvPython}`);

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function createLauncherScript(platform, pythonPath) {
  if (platform === 'win32') {
    return `@echo off
cd /d "%~dp0"
"${pythonPath}" backend\\main.py
pause
`;
  } else {
    return `#!/bin/bash
cd "$(dirname "$0")"
"${pythonPath}" backend/main.py
`;
  }
}
