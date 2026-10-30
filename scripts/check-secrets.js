#!/usr/bin/env node
/**
 * Secret Scanning Script for Southwest Iowa Community Central
 * Scans files for accidental leakage of cleartext credentials, API keys, and private keys.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const FORBIDDEN_PATTERNS = [
  {
    name: 'Private Encryption Key',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    name: 'Stripe Live Secret Key',
    regex: /sk_live_[0-9a-zA-Z]{24,}/,
  },
  {
    name: 'AWS Access Key ID',
    regex: /AKIA[0-9A-Z]{16}/,
  },
  {
    name: 'Cleartext Admin Password',
    regex: /BuiltNetworks2026!/,
  },
  {
    name: 'Hardcoded Cleartext Password Assignment',
    // Matches password = "value" or "password": "value" where value is not empty, a template, or a type
    regex: /(?:password|secret|passwd)\s*[:=]\s*['"](?![$#{\[\s]|YOUR_|your_|TODO|CHANGE_ME|test|dummy)[^'"\n\r]{6,}['"]/i,
  },
  {
    name: 'Documentation Cleartext Password Entry',
    regex: /\*\*(?:Default )?Password:\*\*\s*`[^`\s]+`/i,
  },
];

const IGNORE_FILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'check-secrets.js',
  '.env.example',
  'crypto.ts', // Contains password hashing algorithm logic
];

function getFilesToCheck() {
  const isGitHook = process.argv.includes('--staged');
  try {
    const cmd = isGitHook
      ? 'git diff --cached --name-only --diff-filter=ACM'
      : 'git ls-files';
    const output = execSync(cmd, { encoding: 'utf-8' });
    return output
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f && fs.existsSync(f));
  } catch (err) {
    console.error('Failed to retrieve file list from git:', err.message);
    process.exit(1);
  }
}

function scanFile(filePath) {
  const fileName = path.basename(filePath);
  if (IGNORE_FILES.includes(fileName) || filePath.includes('.git/') || filePath.includes('dist/')) {
    return [];
  }

  // Skip binary files
  try {
    const buffer = fs.readFileSync(filePath);
    // Simple binary check: look for null byte in first 8000 bytes
    if (buffer.slice(0, 8000).includes(0)) return [];
    const content = buffer.toString('utf-8');
    const lines = content.split('\n');
    const findings = [];

    lines.forEach((line, index) => {
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.regex.test(line)) {
          findings.push({
            rule: pattern.name,
            line: index + 1,
            snippet: line.trim().slice(0, 80),
          });
        }
      }
    });

    return findings;
  } catch {
    return [];
  }
}

function main() {
  const files = getFilesToCheck();
  let totalViolations = 0;

  console.log(`🔍 Scanning ${files.length} repository file(s) for cleartext credentials and secrets...`);

  for (const file of files) {
    const violations = scanFile(file);
    if (violations.length > 0) {
      totalViolations += violations.length;
      console.error(`\n❌ [SECURITY VIOLATION] ${file}:`);
      violations.forEach((v) => {
        console.error(`   - Line ${v.line} (${v.rule}): ${v.snippet}`);
      });
    }
  }

  if (totalViolations > 0) {
    console.error(`\n🚨 Secret scan failed: ${totalViolations} potential secret(s) detected.`);
    console.error('Please remove cleartext credentials before committing or pushing.\n');
    process.exit(1);
  } else {
    console.log('✅ Secret scan clean: No cleartext credentials or sensitive keys detected.');
    process.exit(0);
  }
}

main();
