/**
 * Test Suite for Code Analyzer
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CodeAnalyzer } from '../src/tools/code-analyzer.js';

describe('CodeAnalyzer', () => {
  describe('detectVulnerabilities', () => {
    it('should detect eval() usage', async () => {
      const code = 'const x = eval("1 + 1");';
      const vulnerabilities = await CodeAnalyzer.detectVulnerabilities(code);
      
      assert.ok(vulnerabilities.length > 0);
      assert.strictEqual(vulnerabilities[0].type, 'security');
    });

    it('should detect innerHTML usage', async () => {
      const code = 'element.innerHTML = userInput;';
      const vulnerabilities = await CodeAnalyzer.detectVulnerabilities(code);
      
      assert.ok(vulnerabilities.length > 0);
      const hasInnerHTMLWarning = vulnerabilities.some(v => 
        v.message.includes('innerHTML')
      );
      assert.ok(hasInnerHTMLWarning);
    });

    it('should return empty array for safe code', async () => {
      const code = 'const x = 1 + 1; console.log(x);';
      const vulnerabilities = await CodeAnalyzer.detectVulnerabilities(code);
      
      assert.strictEqual(vulnerabilities.length, 0);
    });
  });

  describe('detectCodeSmells', () => {
    it('should detect long files', () => {
      const longCode = 'const x = 1;\n'.repeat(600);
      const smells = CodeAnalyzer.detectCodeSmells(longCode);
      
      assert.ok(smells.length > 0);
      assert.strictEqual(smells[0].type, 'maintainability');
    });
  });
});
