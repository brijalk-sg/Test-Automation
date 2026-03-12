#!/usr/bin/env node
// scripts/generate-tests.mjs
// Run in GitHub Actions to auto-generate/update test files for changed components

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const BASE_SHA = process.env.BASE_SHA;
const HEAD_SHA = process.env.HEAD_SHA;

// --- Step 1: Get changed component files from the PR diff ---

function getChangedComponents() {
  const diff = execSync(
    `git diff --name-only ${BASE_SHA}...${HEAD_SHA} -- '*.tsx' '*.jsx'`,
    { encoding: "utf-8" },
  );

  return diff
    .split("\n")
    .filter(Boolean)
    .filter((f) => {
      const skip = [".test.", ".spec.", ".stories.", ".styles.", ".config."];
      return !skip.some((s) => f.includes(s));
    })
    .filter((f) => existsSync(f)); // Skip deleted files
}

// --- Step 2: Build prompt for Claude ---

function buildPrompt(componentCode, existingTest, filePath) {
  const fileName = path.basename(filePath);
  const hasExistingTest = !!existingTest;

  return `You are a senior frontend testing engineer. Generate comprehensive test cases for this React component using React Testing Library and Jest.

## Component File: ${fileName}
\`\`\`tsx
${componentCode}
\`\`\`

${
  hasExistingTest
    ? `## Existing Test File (update/extend this):
\`\`\`tsx
${existingTest}
\`\`\``
    : "## No existing test file — create one from scratch."
}

## Requirements:
- Use @testing-library/react with Jest
- Test rendering, user interactions, props variations, edge cases
- Include accessibility checks (role queries, aria attributes)
- Test error states and loading states if applicable
- Use descriptive test names: "should [behavior] when [condition]"
- Mock external dependencies and API calls
- If updating an existing file, preserve existing tests and add new ones

## Output:
Return ONLY the complete test file code, no explanations.`;
}

// --- Step 3: Call Claude API ---

async function callClaude(prompt) {
  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

// --- Step 4: Extract code from response ---

function extractCode(response) {
  const match = response.match(/```(?:tsx?|jsx?|javascript)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : response.trim();
}

// --- Step 5: Determine test file path ---

function getTestFilePath(componentPath) {
  const dir = path.dirname(componentPath);
  const ext = path.extname(componentPath);
  const base = path.basename(componentPath, ext);

  const testsDir = path.join(dir, "__tests__");
  if (existsSync(testsDir)) {
    return path.join(testsDir, `${base}.test${ext}`);
  }

  return path.join(dir, `${base}.test${ext}`);
}

// --- Step 6: Post PR comment (GitHub) ---

async function postPRComment(results) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.REPO;
  const prNumber = process.env.PR_NUMBER;

  if (!token || !repo || !prNumber) return;

  const ok = results.filter((r) => r.status === "ok");
  const failed = results.filter((r) => r.status === "error");

  let body = `### 🧪 AI Test Generation Report\n\n`;
  if (ok.length) {
    body += `**Generated/Updated (${ok.length}):**\n`;
    ok.forEach(
      (r) => (body += `- ✅ \`${r.testFile}\` for \`${r.component}\`\n`),
    );
  }
  if (failed.length) {
    body += `\n**Failed (${failed.length}):**\n`;
    failed.forEach((r) => (body += `- ❌ \`${r.component}\`: ${r.error}\n`));
  }
  body += `\n> Review the generated tests before merging.`;

  await fetch(
    `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    },
  );
}

// --- Main ---

async function main() {
  if (!CLAUDE_API_KEY) {
    console.error(
      "CLAUDE_API_KEY not set. Add it in GitHub → Settings → Secrets.",
    );
    process.exit(1);
  }

  const changedFiles = getChangedComponents();

  if (changedFiles.length === 0) {
    console.log("No component changes detected. Skipping.");
    process.exit(0);
  }

  console.log(`Found ${changedFiles.length} changed component(s):\n`);
  changedFiles.forEach((f) => console.log(`  - ${f}`));
  console.log();

  const results = [];

  for (const filePath of changedFiles) {
    try {
      console.log(`Processing: ${filePath}`);

      const componentCode = readFileSync(filePath, "utf-8");
      const testPath = getTestFilePath(filePath);
      const existingTest = existsSync(testPath)
        ? readFileSync(testPath, "utf-8")
        : null;

      // Ensure directory exists
      mkdirSync(path.dirname(testPath), { recursive: true });

      const prompt = buildPrompt(componentCode, existingTest, filePath);
      const response = await callClaude(prompt);
      const testCode = extractCode(response);

      writeFileSync(testPath, testCode, "utf-8");
      console.log(`  ✓ Generated: ${testPath}`);

      results.push({ component: filePath, testFile: testPath, status: "ok" });
    } catch (err) {
      console.error(`  ✗ Failed: ${filePath} — ${err.message}`);
      results.push({
        component: filePath,
        status: "error",
        error: err.message,
      });
    }
  }

  // Summary
  console.log("\n--- Summary ---");
  const ok = results.filter((r) => r.status === "ok");
  const failed = results.filter((r) => r.status === "error");
  console.log(`Generated: ${ok.length} | Failed: ${failed.length}`);

  await postPRComment(results);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
