#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const VERSION = '1.0.1';
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Colors (disabled when not a TTY)
const isTTY = process.stdout.isTTY;
const c = {
  green: isTTY ? '\x1b[32m' : '',
  red: isTTY ? '\x1b[31m' : '',
  blue: isTTY ? '\x1b[34m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  bold: isTTY ? '\x1b[1m' : '',
  dim: isTTY ? '\x1b[2m' : '',
  reset: isTTY ? '\x1b[0m' : '',
};

function printUsage() {
  console.log(`
${c.bold}claude-cortex${c.reset} v${VERSION}
Persistent memory for Claude Code.

${c.bold}Usage:${c.reset}
  claude-cortex init <project-name> [directory]   Initialize memory in a project
  claude-cortex validate [directory]               Validate memory structure
  claude-cortex stats [directory]                  Show memory statistics
  claude-cortex --version                          Show version
  claude-cortex --help                             Show this help
`);
}

// ── init ──────────────────────────────────────────────────────────────

function cmdInit(projectName, targetDir) {
  if (!projectName) {
    console.error(`${c.red}Error: Project name is required.${c.reset}`);
    console.error('Usage: claude-cortex init <project-name> [directory]');
    process.exit(1);
  }

  targetDir = path.resolve(targetDir || '.');
  const memoryDir = path.join(targetDir, '.claude', 'memory');

  if (fs.existsSync(memoryDir)) {
    console.error(`${c.red}Error: Memory directory already exists at ${memoryDir}${c.reset}`);
    console.error('Use the existing memory system or remove the directory first.');
    process.exit(1);
  }

  if (!fs.existsSync(TEMPLATES_DIR)) {
    console.error(`${c.red}Error: Templates not found at ${TEMPLATES_DIR}${c.reset}`);
    console.error('Make sure claude-cortex is installed correctly.');
    process.exit(1);
  }

  console.log(`${c.bold}Initializing Claude Memory System${c.reset}`);
  console.log(`  Project: ${c.blue}${projectName}${c.reset}`);
  console.log(`  Target:  ${c.blue}${targetDir}${c.reset}`);
  console.log('');

  fs.mkdirSync(memoryDir, { recursive: true });

  // Copy and customize MEMORY.md
  const memoryTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'MEMORY.md'), 'utf8');
  fs.writeFileSync(
    path.join(memoryDir, 'MEMORY.md'),
    memoryTemplate.replace(/\[PROJECT_NAME\]/g, projectName)
  );
  console.log(`  ${c.green}+${c.reset} .claude/memory/MEMORY.md`);

  // Copy activity log
  fs.copyFileSync(
    path.join(TEMPLATES_DIR, 'activity-log.md'),
    path.join(memoryDir, 'activity-log.md')
  );
  console.log(`  ${c.green}+${c.reset} .claude/memory/activity-log.md`);

  // Copy and customize project template
  const projectTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'project-template.md'), 'utf8');
  fs.writeFileSync(
    path.join(memoryDir, `project-${projectName}.md`),
    projectTemplate.replace(/\[PROJECT_NAME\]/g, projectName)
  );
  console.log(`  ${c.green}+${c.reset} .claude/memory/project-${projectName}.md`);

  // Copy feedback template
  fs.copyFileSync(
    path.join(TEMPLATES_DIR, 'feedback-template.md'),
    path.join(memoryDir, 'feedback-preferences.md')
  );
  console.log(`  ${c.green}+${c.reset} .claude/memory/feedback-preferences.md`);

  // Create CLAUDE.md if it doesn't exist
  const claudeMd = path.join(targetDir, '.claude', 'CLAUDE.md');
  if (!fs.existsSync(claudeMd)) {
    fs.writeFileSync(claudeMd, `## Memory System

At the START of every session:
1. Read \`.claude/memory/MEMORY.md\` to load the master index
2. Load topic files relevant to the current task
3. Check the activity log for recent session context

At the END of every session:
1. Update \`.claude/memory/activity-log.md\` with: date, work done, decisions made, next steps
2. Update any topic files that changed (new patterns, resolved incidents, etc.)
3. If a new topic file was created, add it to \`MEMORY.md\` index

Rules:
- Keep \`MEMORY.md\` under 200 lines (it is an index, not a dump)
- Use relative links between memory files
- Be specific in incident runbooks (include exact error messages)
- Cross-reference between files when relevant
`);
    console.log(`  ${c.green}+${c.reset} .claude/CLAUDE.md`);
  }

  console.log('');
  console.log(`${c.green}${c.bold}Done.${c.reset} Memory system initialized for '${projectName}'.`);
}

// ── validate ──────────────────────────────────────────────────────────

function cmdValidate(targetDir) {
  targetDir = path.resolve(targetDir || '.');
  const memoryDir = path.join(targetDir, '.claude', 'memory');
  let errors = 0;
  let warnings = 0;

  const pass = (msg) => console.log(`  ${c.green}PASS${c.reset}  ${msg}`);
  const fail = (msg) => { console.log(`  ${c.red}FAIL${c.reset}  ${msg}`); errors++; };
  const warn = (msg) => { console.log(`  ${c.yellow}WARN${c.reset}  ${msg}`); warnings++; };

  console.log(`${c.bold}Claude Memory System - Validation${c.reset}`);
  console.log(`Directory: ${c.blue}${memoryDir}${c.reset}`);
  console.log('');

  // Check directory exists
  if (!fs.existsSync(memoryDir)) {
    fail(`Memory directory does not exist: ${memoryDir}`);
    console.log('');
    console.log(`${c.red}${c.bold}Validation failed.${c.reset} Run 'claude-cortex init <project>' first.`);
    process.exit(1);
  }

  // Check MEMORY.md
  const memoryFile = path.join(memoryDir, 'MEMORY.md');
  if (fs.existsSync(memoryFile)) {
    pass('MEMORY.md exists');
    const lines = fs.readFileSync(memoryFile, 'utf8').split('\n').length;
    if (lines <= 200) {
      pass(`MEMORY.md is ${lines} lines (max 200)`);
    } else {
      warn(`MEMORY.md is ${lines} lines (recommended max: 200)`);
    }
  } else {
    fail('MEMORY.md not found');
  }

  // Check activity log
  const activityLog = path.join(memoryDir, 'activity-log.md');
  if (fs.existsSync(activityLog)) {
    pass('activity-log.md exists');
    const stat = fs.statSync(activityLog);
    const ageDays = Math.floor((Date.now() - stat.mtimeMs) / 86400000);
    if (ageDays <= 14) {
      pass(`Activity log updated ${ageDays} days ago`);
    } else {
      warn(`Activity log is ${ageDays} days old (consider updating)`);
    }
  } else {
    warn('activity-log.md not found (recommended for session tracking)');
  }

  // Check linked files
  if (fs.existsSync(memoryFile)) {
    console.log('');
    console.log(`${c.bold}Checking linked files...${c.reset}`);
    const content = fs.readFileSync(memoryFile, 'utf8');
    const linkRegex = /\]\(([^)]+\.md)\)/g;
    let match;
    const linkedFiles = new Set();
    while ((match = linkRegex.exec(content)) !== null) {
      linkedFiles.add(match[1]);
    }
    for (const linked of linkedFiles) {
      if (fs.existsSync(path.join(memoryDir, linked))) {
        pass(`Linked file exists: ${linked}`);
      } else {
        fail(`Linked file missing: ${linked}`);
      }
    }
  }

  // Check unreferenced files
  if (fs.existsSync(memoryFile)) {
    console.log('');
    console.log(`${c.bold}Checking for unreferenced files...${c.reset}`);
    const content = fs.readFileSync(memoryFile, 'utf8');
    const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md') && f !== 'MEMORY.md');
    for (const file of files) {
      if (content.includes(file)) {
        pass(`Referenced: ${file}`);
      } else {
        warn(`Not referenced in MEMORY.md: ${file}`);
      }
    }
  }

  // Check file sizes
  console.log('');
  console.log(`${c.bold}Checking file sizes...${c.reset}`);
  const mdFiles = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
  for (const file of mdFiles) {
    const lines = fs.readFileSync(path.join(memoryDir, file), 'utf8').split('\n').length;
    if (lines > 500) {
      warn(`${file} is ${lines} lines (consider splitting at 500)`);
    } else {
      pass(`${file}: ${lines} lines`);
    }
  }

  // Summary
  console.log('');
  console.log(`${c.bold}Summary${c.reset}`);
  if (errors === 0 && warnings === 0) {
    console.log(`${c.green}${c.bold}All checks passed.${c.reset} Memory structure is healthy.`);
  } else if (errors === 0) {
    console.log(`${c.yellow}${c.bold}${warnings} warning(s).${c.reset} No critical issues found.`);
  } else {
    console.log(`${c.red}${c.bold}${errors} error(s), ${warnings} warning(s).${c.reset} Fix errors above.`);
  }

  process.exit(errors);
}

// ── stats ─────────────────────────────────────────────────────────────

function cmdStats(targetDir) {
  targetDir = path.resolve(targetDir || '.');
  const memoryDir = path.join(targetDir, '.claude', 'memory');

  console.log(`${c.bold}Claude Memory System - Statistics${c.reset}`);
  console.log(`Directory: ${c.blue}${memoryDir}${c.reset}`);
  console.log('');

  if (!fs.existsSync(memoryDir)) {
    console.error(`${c.red}Error: Directory not found: ${memoryDir}${c.reset}`);
    console.error("Run 'claude-cortex init <project>' first.");
    process.exit(1);
  }

  const mdFiles = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));

  let totalLines = 0;
  let projectFiles = 0, integrationFiles = 0, incidentFiles = 0;
  let referenceFiles = 0, feedbackFiles = 0, otherFiles = 0;
  let largestFile = '', largestLines = 0;

  for (const file of mdFiles) {
    const content = fs.readFileSync(path.join(memoryDir, file), 'utf8');
    const lines = content.split('\n').length;
    totalLines += lines;

    if (lines > largestLines) {
      largestLines = lines;
      largestFile = file;
    }

    if (file.startsWith('project-')) projectFiles++;
    else if (file.startsWith('integration-')) integrationFiles++;
    else if (file.startsWith('incident-')) incidentFiles++;
    else if (file.startsWith('reference-')) referenceFiles++;
    else if (file.startsWith('feedback-')) feedbackFiles++;
    else if (file !== 'MEMORY.md' && file !== 'activity-log.md') otherFiles++;
  }

  // MEMORY.md line count
  let memoryLines = 0;
  const memoryFile = path.join(memoryDir, 'MEMORY.md');
  if (fs.existsSync(memoryFile)) {
    memoryLines = fs.readFileSync(memoryFile, 'utf8').split('\n').length;
  }

  // Session count
  let sessionCount = 0;
  const activityLog = path.join(memoryDir, 'activity-log.md');
  if (fs.existsSync(activityLog)) {
    const content = fs.readFileSync(activityLog, 'utf8');
    sessionCount = (content.match(/^## [0-9]/gm) || []).length;
  }

  // Last modified
  let newestFile = '';
  let newestTime = 0;
  for (const file of mdFiles) {
    const stat = fs.statSync(path.join(memoryDir, file));
    if (stat.mtimeMs > newestTime) {
      newestTime = stat.mtimeMs;
      newestFile = file;
    }
  }

  console.log(`${c.bold}Overview${c.reset}`);
  console.log(`  Total files:       ${c.green}${mdFiles.length}${c.reset}`);
  console.log(`  Total lines:       ${c.green}${totalLines}${c.reset}`);
  console.log(`  Sessions logged:   ${c.green}${sessionCount}${c.reset}`);
  console.log(`  MEMORY.md lines:   ${c.green}${memoryLines}${c.reset} / 200`);
  console.log('');

  console.log(`${c.bold}Files by Type${c.reset}`);
  const pad = (s, n) => s.padEnd(n);
  console.log(`  ${pad('Project files:', 20)} ${projectFiles}`);
  console.log(`  ${pad('Integration docs:', 20)} ${integrationFiles}`);
  console.log(`  ${pad('Incident runbooks:', 20)} ${incidentFiles}`);
  console.log(`  ${pad('Reference notes:', 20)} ${referenceFiles}`);
  console.log(`  ${pad('Feedback files:', 20)} ${feedbackFiles}`);
  console.log(`  ${pad('Other:', 20)} ${otherFiles}`);
  console.log('');

  console.log(`${c.bold}Details${c.reset}`);
  if (largestFile) console.log(`  Largest file:      ${c.blue}${largestFile}${c.reset} (${largestLines} lines)`);
  if (newestFile) console.log(`  Last modified:     ${c.blue}${newestFile}${c.reset}`);
  console.log('');

  // Bar chart
  console.log(`${c.bold}File Sizes${c.reset}`);
  for (const file of mdFiles) {
    const lines = fs.readFileSync(path.join(memoryDir, file), 'utf8').split('\n').length;
    let barLen = Math.min(Math.floor(lines / 10), 40);
    if (barLen < 1 && lines > 0) barLen = 1;
    const bar = '#'.repeat(barLen);
    console.log(`  ${pad(file, 30)} ${String(lines).padStart(4)}  ${c.green}${bar}${c.reset}`);
  }
}

// ── main ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  printUsage();
  process.exit(0);
}

if (command === '--version' || command === '-v') {
  console.log(`claude-cortex v${VERSION}`);
  process.exit(0);
}

switch (command) {
  case 'init':
    cmdInit(args[1], args[2]);
    break;
  case 'validate':
    cmdValidate(args[1]);
    break;
  case 'stats':
    cmdStats(args[1]);
    break;
  default:
    console.error(`${c.red}Unknown command: ${command}${c.reset}`);
    printUsage();
    process.exit(1);
}
