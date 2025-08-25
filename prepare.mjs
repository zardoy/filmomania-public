#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const pkgPath = path.join(repoRoot, 'package.json');

const runNumber = process.env.RUN_NUMBER || process.argv[2] || '';

const pkgRaw = fs.readFileSync(pkgPath, 'utf-8');
const pkg = JSON.parse(pkgRaw);

const baseVersion = pkg.version || '0.0.0';
const appVersion = runNumber ? `0.0.0-alpha.${runNumber}` : baseVersion;

// Patch package.json version
pkg.version = appVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Patched package.json version to: ${appVersion}`);
