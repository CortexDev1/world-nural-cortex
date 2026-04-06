#!/usr/bin/env node
/**
 * NURAL CORTEX — Knowledge Brain Data Extractor
 * Scans skills, agents, reports, and academic courses to build a comprehensive JSON graph.
 */

const fs = require('fs');
const path = require('path');

// --- Paths ---
const SKILLS_DIR = '/Users/chowdhury/.claude/skills';
const AGENTS_DIRS = [
  '/Users/chowdhury/.claude/agents',
  '/Users/chowdhury/Library/Mobile Documents/iCloud~md~obsidian/Documents/Agent Swarm - Home/.claude/agents',
];
const REPORTS_DIR = '/Users/chowdhury/Library/Mobile Documents/iCloud~md~obsidian/Documents/Agent Swarm - Home/.raven/reports';
const COURSES_BASE = '/Users/chowdhury/Library/Mobile Documents/iCloud~md~obsidian/Documents/Agent Swarm - Home';
const OBSIDIAN_VAULT = '/Users/chowdhury/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian - Claude';
const NEXUS_FORGE_DIR = '/Users/chowdhury/Library/Mobile Documents/iCloud~md~obsidian/Documents/Agent Swarm - Home/nexus-forge';
const OUTPUT_FILE = '/Users/chowdhury/Library/Mobile Documents/iCloud~md~obsidian/Documents/Agent Swarm - Home/world-nural-cortex/public/data/knowledge.json';

// --- Domain Classification ---
const DOMAIN_RULES = [
  {
    domain: 'meta',
    patterns: /\b(nexus|powerpacks?|swarm|symphony|raven|universal.agent|skill.evolution|workflow.to.skill)\b/i,
  },
  {
    domain: 'fashion',
    patterns: /\b(fashion|versali|tech.?pack|supplier|shopify|garment|showroom|apparel|fabric|bom|grading|sampling)\b/i,
  },
  {
    domain: 'career',
    patterns: /\b(pro.career|pro.linkedin|career.stage|linkedin.profile|linkedin.growth)\b/i,
  },
  {
    domain: 'academic',
    patterns: /\b(mit.|carleton|academic|genai.faculty|genai.academic|genai.responsible|genai.prompt|timg|research.mastery)\b/i,
  },
  {
    domain: 'business',
    patterns: /\b(venture|competitive|revenue|consulting|brand.system|ip.fortress|regulatory|startup|economy|market|anti.fragile|attention.economy|first.mover|decision.velocity|narrative.reality|civilization|crisis|exponential|cross.cultural|aerial|polyphonic|quantum.possibility|deep.space|zero.gravity|second.order|temporal.arbitrage|information.foraging|ai.workflow.packager|ai.consulting|expert.prompt|student.benefits|digital.rights|digital.heritage)\b/i,
  },
  {
    domain: 'engineering',
    patterns: /\b(claude.code|bash|mcp|plugin|skill.creator|dev.env|token.optim|context.window|computer.use|cursor|dispatch|vibe.coding|frontend|webapp|web.artifacts|docx|pdf|pptx|xlsx|canvas|algorithmic.art|slack|remotion|sync.obsidian|lightrag|obsidian.brain|content.machine|agentic.loop|harmonic.api|recursive.composition|markdown.orchestration|llm.knowledge.base|personal.wiki|knowledge.archaeology|self.healing|doc.coauthoring|internal.comms|brand.guidelines|theme.factory|3d.avatar|eachlabs|raven.gui|model.release|agent.eval|hookify)\b/i,
  },
  {
    domain: 'ai',
    patterns: /\b(ai|ml|neural|embedding|model|llm|inference|training|paradigm|cognitive|jepa|attention|transformer|agent.trust|autonomous|self.supervised|contrastive|multimodal|vision|language|rlvr|scaling|frontier|benchmark|evaluation|agentic.orchestration|meta.learning|world.model|encoding|fusion|non.autoregressive|selective|latent|information.bottleneck|predictive|sample.efficiency|streaming|compute|ghost.intelligence|cognitive.architecture|encoder|semi.formal|post.autoregressive|autoresearch|prompt.engineering|fitness.function|swarm.intelligence|emergent|embodied|video.understanding|programmer.10x|metacognitive|ibm.quantum|ibm.security|ibm.cplex|ibm.responsible|ibm.automation|ai.memory|ai.governance|ai.benchmark|ai.paradigm|ai.efficiency|gemma|rlvr|paradigm.shift|paradigm.detect)\b/i,
  },
];

function classifyDomain(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  for (const rule of DOMAIN_RULES) {
    if (rule.patterns.test(text)) {
      return rule.domain;
    }
  }
  return 'ai'; // default
}

// --- Frontmatter Parser ---
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return { body: content, meta: {} };
  const rawMeta = match[1];
  const body = content.slice(match[0].length).trim();
  const meta = {};

  // Simple YAML parser for name/description
  let currentKey = null;
  let currentValue = '';
  for (const line of rawMeta.split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (kvMatch) {
      if (currentKey) {
        meta[currentKey] = currentValue.trim().replace(/^["']|["']$/g, '');
      }
      currentKey = kvMatch[1];
      currentValue = kvMatch[2];
    } else if (currentKey && (line.startsWith('  ') || line.startsWith('\t'))) {
      currentValue += ' ' + line.trim();
    }
  }
  if (currentKey) {
    meta[currentKey] = currentValue.trim().replace(/^["']|["']$/g, '');
  }

  // Handle multi-line description with > or |
  if (meta.description && meta.description === '>') {
    // Collect indented lines after description:
    const descMatch = rawMeta.match(/description:\s*>\s*\n([\s\S]*?)(?=\n\w|\n---)/);
    if (descMatch) {
      meta.description = descMatch[1].split('\n').map(l => l.trim()).filter(Boolean).join(' ');
    }
  }

  return { body, meta };
}

// --- Extract Skills ---
function extractSkills() {
  const skills = [];
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillFile = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;

    const content = fs.readFileSync(skillFile, 'utf-8');
    const { body, meta } = parseFrontmatter(content);

    const name = meta.name || entry.name;
    let description = meta.description || '';

    // If description is empty or too short, grab first meaningful line from body
    if (!description || description.length < 10) {
      const firstLine = body.split('\n').find(l => l.trim() && !l.startsWith('#'));
      description = firstLine ? firstLine.trim() : name;
    }

    // Truncate description for the JSON (keep it reasonable)
    if (description.length > 300) {
      description = description.slice(0, 297) + '...';
    }

    const domain = classifyDomain(name, description);

    skills.push({
      id: entry.name,
      name,
      description,
      domain,
    });
  }

  return skills;
}

// --- Extract Agents ---
function extractAgents() {
  const agents = [];
  const seen = new Set();

  for (const agentDir of AGENTS_DIRS) {
    if (!fs.existsSync(agentDir)) continue;
    const files = fs.readdirSync(agentDir).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const slug = file.replace('.md', '');
      if (seen.has(slug)) continue;
      seen.add(slug);

      const content = fs.readFileSync(path.join(agentDir, file), 'utf-8');
      const { body, meta } = parseFrontmatter(content);

      const name = meta.name || slug;
      let description = meta.description || '';

      if (description.length > 300) {
        description = description.slice(0, 297) + '...';
      }

      const domain = classifyDomain(name, description);

      agents.push({
        id: slug,
        name,
        description,
        domain,
      });
    }
  }

  return agents;
}

// --- Extract Reports ---
function extractReports() {
  const reports = [];
  const entries = fs.readdirSync(REPORTS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

    const filename = entry.name.replace('.md', '');

    // Parse date from filename: YYYY-MM-DD-...
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)/);
    if (!dateMatch) continue;

    const date = dateMatch[1];
    const rest = dateMatch[2];

    // Determine report type
    let type = 'general';
    if (rest.startsWith('chronicler')) type = 'chronicler';
    else if (rest.startsWith('scholar')) type = 'scholar';
    else if (rest.startsWith('nexus-forge')) type = 'nexus-forge';
    else if (rest.startsWith('strategist')) type = 'strategist';
    else if (rest.includes('morning')) type = 'morning';
    else if (rest.includes('evening')) type = 'evening';

    // Build a readable title from the rest
    const title = rest
      .replace(/^(chronicler|scholar|nexus-forge|strategist)-/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    // Classify domain from title
    const domain = classifyDomain(filename, title);

    reports.push({
      id: filename,
      title,
      date,
      type,
      domain,
    });
  }

  return reports;
}

// --- Extract Academic Courses ---
function extractCourses() {
  const courses = [];
  const courseMap = {
    'TIMG5001A-Principles-of-Tech-Innovation-Mgmt': {
      code: 'TIMG5001A',
      name: 'Principles of Technology Innovation Management',
      topics: ['Innovation frameworks', 'Technology adoption', 'Disruptive innovation', 'Strategic planning'],
    },
    'TIMG5002B-Technology-Entrepreneurship': {
      code: 'TIMG5002B',
      name: 'Technology Entrepreneurship',
      topics: ['Lean startup', 'Business model canvas', 'Venture financing', 'Market validation'],
    },
    'TIMG5003A-Issues-in-Tech-Innovation-Mgmt': {
      code: 'TIMG5003A',
      name: 'Issues in Technology Innovation Management',
      topics: ['IP management', 'Platform economics', 'Open innovation', 'Technology standards'],
    },
    'TIMG5008A-Digital-Transform-Entrepreneurship': {
      code: 'TIMG5008A',
      name: 'Digital Transformation & Entrepreneurship',
      topics: ['Digital transformation', 'AI adoption', 'Data-driven decision making', 'Agile methodology'],
    },
    'TIMG5103-Prompt-Engineering-in-Business': {
      code: 'TIMG5103',
      name: 'Prompt Engineering in Business',
      topics: ['Prompt design', 'Embeddings', 'RAG systems', 'Semantic similarity', 'AI workflow automation'],
    },
  };

  // Scan for TIMG directories
  const baseDirEntries = fs.readdirSync(COURSES_BASE, { withFileTypes: true });
  for (const entry of baseDirEntries) {
    if (!entry.isDirectory() || !entry.name.startsWith('TIMG')) continue;
    const info = courseMap[entry.name];
    if (!info) continue;

    // Try to extract topics from subdirectories (Week-* folders)
    const courseDir = path.join(COURSES_BASE, entry.name);
    const subEntries = fs.readdirSync(courseDir, { withFileTypes: true });
    const weekTopics = subEntries
      .filter(e => e.isDirectory() && e.name.startsWith('Week-'))
      .map(e => e.name.replace(/^Week-\d+-/, '').replace(/-/g, ' '))
      .filter(t => t.length > 0);

    if (weekTopics.length > 0) {
      info.topics = [...new Set([...info.topics, ...weekTopics])];
    }

    courses.push({
      id: info.code,
      name: info.name,
      topics: info.topics,
    });
  }

  return courses;
}

// --- Extract Obsidian Notes ---
const OBSIDIAN_SKIP_FOLDERS = new Set([
  '.trash', '.obsidian', '9 - Templates', 'Attachments', 'Excalidraw',
]);

const FOLDER_DEFAULT_DOMAIN = {
  '1 - Projects': 'engineering',
  '2 - Areas': 'business',
  '3 - Resources': 'engineering',
  '4 - Archive': 'meta',
  '5 - LLM Workspace': 'ai',
  '6 - Knowledge Garden': 'ai',
  '7 - Maps of Content': 'meta',
  '8 - Daily Notes': 'meta',
  '0 - Inbox': 'meta',
};

function extractWikilinks(content) {
  // Use match() to avoid exec() (which triggers security lint false positive)
  const matches = content.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g) || [];
  return matches.map(m => {
    const inner = m.slice(2, -2);
    const pipeIdx = inner.indexOf('|');
    return (pipeIdx !== -1 ? inner.slice(0, pipeIdx) : inner).trim();
  });
}

function extractObsidianNotes() {
  const notes = [];
  if (!fs.existsSync(OBSIDIAN_VAULT)) return notes;

  function walkDir(dir, folderCategory) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      if (OBSIDIAN_SKIP_FOLDERS.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const newCategory = folderCategory || entry.name;
        walkDir(fullPath, newCategory);
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

      try {
        const stat = fs.statSync(fullPath);
        if (stat.size < 100) continue;
      } catch {
        continue;
      }

      let content = '';
      try {
        content = fs.readFileSync(fullPath, 'utf-8');
      } catch {
        continue;
      }

      const { meta } = parseFrontmatter(content);
      const title = entry.name.replace(/\.md$/, '');
      const wikilinks = extractWikilinks(content);

      let tags = [];
      if (meta.tags && typeof meta.tags === 'string') {
        tags = meta.tags.split(/[\s,]+/).filter(Boolean);
      }

      const snippet = content.slice(0, 500);
      const textForRules = `${title} ${snippet}`.toLowerCase();
      const anyRuleMatched = DOMAIN_RULES.some(r => r.patterns.test(textForRules));
      let domain = classifyDomain(title, snippet);
      if (!anyRuleMatched && folderCategory && FOLDER_DEFAULT_DOMAIN[folderCategory]) {
        domain = FOLDER_DEFAULT_DOMAIN[folderCategory];
      }

      const relPath = path.relative(OBSIDIAN_VAULT, fullPath);
      const id = relPath.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').toLowerCase();

      notes.push({ id, title, folder: folderCategory || 'root', tags, domain, wikilinks });
    }
  }

  walkDir(OBSIDIAN_VAULT, null);
  return notes;
}

// --- Extract Lectures from TIMG course directories ---
function extractLectures() {
  const lectures = [];
  const courseMap = {
    'TIMG5001A-Principles-of-Tech-Innovation-Mgmt': 'TIMG5001A',
    'TIMG5002B-Technology-Entrepreneurship': 'TIMG5002B',
    'TIMG5003A-Issues-in-Tech-Innovation-Mgmt': 'TIMG5003A',
    'TIMG5008A-Digital-Transform-Entrepreneurship': 'TIMG5008A',
    'TIMG5103-Prompt-Engineering-in-Business': 'TIMG5103',
  };

  const baseDirEntries = fs.readdirSync(COURSES_BASE, { withFileTypes: true });
  for (const entry of baseDirEntries) {
    if (!entry.isDirectory() || !entry.name.startsWith('TIMG')) continue;
    const courseCode = courseMap[entry.name];
    if (!courseCode) continue;

    const courseDir = path.join(COURSES_BASE, entry.name);

    function walkCourseDir(dir) {
      let dirEntries;
      try {
        dirEntries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of dirEntries) {
        const fullPath = path.join(dir, e.name);
        if (e.isDirectory()) {
          walkCourseDir(fullPath);
          continue;
        }
        if (!e.isFile()) continue;
        const isMd = e.name.endsWith('.md');
        const isPdf = e.name.endsWith('.pdf');
        if (!isMd && !isPdf) continue;

        try {
          const stat = fs.statSync(fullPath);
          if (stat.size < 100) continue;
        } catch {
          continue;
        }

        const title = e.name.replace(/\.(md|pdf)$/, '').replace(/-/g, ' ').trim();
        const relPath = path.relative(COURSES_BASE, fullPath);
        const id = relPath.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').toLowerCase();
        lectures.push({ id, title, course: courseCode, domain: 'academic' });
      }
    }

    walkCourseDir(courseDir);
  }

  return lectures;
}

// --- Extract NEXUS FORGE outputs as reports ---
function extractNexusForge() {
  const nexusReports = [];
  if (!fs.existsSync(NEXUS_FORGE_DIR)) return nexusReports;

  let entries;
  try {
    entries = fs.readdirSync(NEXUS_FORGE_DIR, { withFileTypes: true });
  } catch {
    return nexusReports;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

    const filename = entry.name.replace('.md', '');
    const fullPath = path.join(NEXUS_FORGE_DIR, entry.name);

    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf-8');
    } catch {
      continue;
    }

    const { meta } = parseFrontmatter(content);
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)/);
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
    const rest = dateMatch ? dateMatch[2] : filename;
    const title = (meta.title || rest).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const domain = classifyDomain(filename, content.slice(0, 500));

    nexusReports.push({ id: `nexus-forge-${filename}`, title, date, type: 'nexus-forge', domain });
  }

  return nexusReports;
}

// --- Build Graph ---
function buildGraph(skills, agents, reports, courses, notes, lectures) {
  const nodes = [];
  const edges = [];
  const edgeSet = new Set(); // prevent duplicates

  function addEdge(source, target, weight, reason) {
    const key = [source, target].sort().join('::');
    if (edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({ source, target, weight, reason });
  }

  // Create nodes for skills
  for (const skill of skills) {
    nodes.push({
      id: `skill:${skill.id}`,
      label: skill.name,
      type: 'skill',
      domain: skill.domain,
      connections: 0,
    });
  }

  // Create nodes for agents
  for (const agent of agents) {
    nodes.push({
      id: `agent:${agent.id}`,
      label: agent.name,
      type: 'agent',
      domain: agent.domain,
      connections: 0,
    });
  }

  // Create nodes for reports
  for (const report of reports) {
    nodes.push({
      id: `report:${report.id}`,
      label: report.title,
      type: 'report',
      domain: report.domain,
      connections: 0,
    });
  }

  // Create nodes for courses
  for (const course of courses) {
    nodes.push({
      id: `course:${course.id}`,
      label: course.name,
      type: 'course',
      domain: 'academic',
      connections: 0,
    });
  }

  // Create nodes for Obsidian notes
  for (const note of notes) {
    nodes.push({
      id: `note:${note.id}`,
      label: note.title,
      type: 'note',
      domain: note.domain,
      connections: 0,
    });
  }

  // Create nodes for course lectures
  for (const lecture of lectures) {
    nodes.push({
      id: `lecture:${lecture.id}`,
      label: lecture.title,
      type: 'lecture',
      domain: lecture.domain,
      connections: 0,
    });
  }

  // --- Edge generation ---

  // 1. Skills in the same domain (weight 1) — limit to avoid explosion
  const domainGroups = {};
  for (const skill of skills) {
    if (!domainGroups[skill.domain]) domainGroups[skill.domain] = [];
    domainGroups[skill.domain].push(skill);
  }

  for (const [domain, group] of Object.entries(domainGroups)) {
    // Connect each skill to up to 5 nearest neighbors in same domain
    for (let i = 0; i < group.length; i++) {
      const limit = Math.min(i + 6, group.length);
      for (let j = i + 1; j < limit; j++) {
        addEdge(`skill:${group[i].id}`, `skill:${group[j].id}`, 1, `same-domain:${domain}`);
      }
    }
  }

  // 2. Skills that reference each other by name (weight 3)
  const skillContents = {};
  for (const skill of skills) {
    const skillFile = path.join(SKILLS_DIR, skill.id, 'SKILL.md');
    try {
      skillContents[skill.id] = fs.readFileSync(skillFile, 'utf-8').toLowerCase();
    } catch {
      skillContents[skill.id] = '';
    }
  }

  for (const skill of skills) {
    const content = skillContents[skill.id];
    for (const other of skills) {
      if (skill.id === other.id) continue;
      // Check if this skill's content mentions the other skill by ID
      if (content.includes(other.id.toLowerCase())) {
        addEdge(`skill:${skill.id}`, `skill:${other.id}`, 3, 'cross-reference');
      }
    }
  }

  // 3. Powerpacks and their component skills (weight 3)
  const powerpacks = skills.filter(s => s.id.startsWith('powerpacks-'));
  for (const pp of powerpacks) {
    const content = skillContents[pp.id] || '';
    for (const skill of skills) {
      if (skill.id === pp.id) continue;
      if (content.includes(skill.id.toLowerCase())) {
        addEdge(`skill:${pp.id}`, `skill:${skill.id}`, 3, 'powerpack-component');
      }
    }
  }

  // 4. Reports and related skills/domains (weight 2)
  for (const report of reports) {
    const reportText = report.id.toLowerCase() + ' ' + report.title.toLowerCase();
    // Connect to skills in same domain
    const domainSkills = (domainGroups[report.domain] || []).slice(0, 5);
    for (const skill of domainSkills) {
      addEdge(`report:${report.id}`, `skill:${skill.id}`, 2, 'report-domain-match');
    }
    // Connect to skills mentioned by name in report filename
    for (const skill of skills) {
      if (reportText.includes(skill.id.replace(/-/g, ' ')) || reportText.includes(skill.id)) {
        addEdge(`report:${report.id}`, `skill:${skill.id}`, 2, 'report-skill-reference');
      }
    }
  }

  // 5. Agents and skills they reference (weight 2)
  for (const agent of agents) {
    let content = '';
    for (const agentDir of AGENTS_DIRS) {
      const agentFile = path.join(agentDir, agent.id + '.md');
      try {
        content = fs.readFileSync(agentFile, 'utf-8').toLowerCase();
        break;
      } catch {
        continue;
      }
    }
    if (!content) continue;
    for (const skill of skills) {
      if (content.includes(skill.id.toLowerCase())) {
        addEdge(`agent:${agent.id}`, `skill:${skill.id}`, 2, 'agent-uses-skill');
      }
    }
    // Also connect agents in same domain
    for (const otherAgent of agents) {
      if (agent.id === otherAgent.id) continue;
      if (agent.domain === otherAgent.domain) {
        addEdge(`agent:${agent.id}`, `agent:${otherAgent.id}`, 1, `same-domain:${agent.domain}`);
      }
    }
  }

  // 6. Academic courses and related skills (weight 2)
  for (const course of courses) {
    const courseText = (course.name + ' ' + course.topics.join(' ')).toLowerCase();
    for (const skill of skills) {
      const skillText = (skill.name + ' ' + skill.description).toLowerCase();
      // Match on shared significant terms
      const courseTerms = courseText.split(/\W+/).filter(t => t.length > 4);
      const skillTerms = new Set(skillText.split(/\W+/).filter(t => t.length > 4));
      const overlap = courseTerms.filter(t => skillTerms.has(t));
      if (overlap.length >= 2) {
        addEdge(`course:${course.id}`, `skill:${skill.id}`, 2, 'course-skill-overlap');
      }
    }
  }

  // 7. Obsidian note wikilink edges (weight 4)
  const noteTitleMap = new Map(); // lowercase title -> note id
  for (const note of notes) {
    noteTitleMap.set(note.title.toLowerCase(), note.id);
  }
  for (const note of notes) {
    for (const wikilink of note.wikilinks) {
      const targetId = noteTitleMap.get(wikilink.toLowerCase());
      if (targetId && targetId !== note.id) {
        addEdge(`note:${note.id}`, `note:${targetId}`, 4, 'wikilink');
      }
    }
  }

  // 8. Same-folder note edges (weight 1) — max 3 neighbors to avoid explosion
  const folderGroups = {};
  for (const note of notes) {
    if (!folderGroups[note.folder]) folderGroups[note.folder] = [];
    folderGroups[note.folder].push(note);
  }
  for (const group of Object.values(folderGroups)) {
    for (let i = 0; i < group.length; i++) {
      const limit = Math.min(i + 4, group.length);
      for (let j = i + 1; j < limit; j++) {
        addEdge(`note:${group[i].id}`, `note:${group[j].id}`, 1, 'same-folder');
      }
    }
  }

  // 9. Note-to-skill edges (weight 2) — if note mentions skill by name
  for (const note of notes) {
    const noteText = note.title.toLowerCase();
    for (const skill of skills) {
      if (noteText.includes(skill.id.toLowerCase()) || noteText.includes(skill.name.toLowerCase())) {
        addEdge(`note:${note.id}`, `skill:${skill.id}`, 2, 'note-skill-reference');
      }
    }
  }

  // 10. Note-to-report edges (weight 2) — if note title matches report title words
  for (const note of notes) {
    const noteWords = new Set(note.title.toLowerCase().split(/\W+/).filter(t => t.length > 4));
    for (const report of reports) {
      const reportWords = report.title.toLowerCase().split(/\W+/).filter(t => t.length > 4);
      const overlap = reportWords.filter(w => noteWords.has(w));
      if (overlap.length >= 2) {
        addEdge(`note:${note.id}`, `report:${report.id}`, 2, 'note-report-match');
      }
    }
  }

  // 11. Lecture-to-course edges (weight 3)
  for (const lecture of lectures) {
    addEdge(`lecture:${lecture.id}`, `course:${lecture.course}`, 3, 'lecture-course');
  }

  // 12. Lecture-to-skill edges (weight 2) — if lecture title shares keywords with skill
  for (const lecture of lectures) {
    const lectWords = new Set(lecture.title.toLowerCase().split(/\W+/).filter(t => t.length > 4));
    for (const skill of skills) {
      const skillWords = (skill.name + ' ' + skill.description).toLowerCase().split(/\W+/).filter(t => t.length > 4);
      const overlap = skillWords.filter(w => lectWords.has(w));
      if (overlap.length >= 2) {
        addEdge(`lecture:${lecture.id}`, `skill:${skill.id}`, 2, 'lecture-skill-overlap');
      }
    }
  }

  // Count connections per node
  const connectionCount = {};
  for (const edge of edges) {
    connectionCount[edge.source] = (connectionCount[edge.source] || 0) + 1;
    connectionCount[edge.target] = (connectionCount[edge.target] || 0) + 1;
  }
  for (const node of nodes) {
    node.connections = connectionCount[node.id] || 0;
  }

  return { nodes, edges };
}

// --- Main ---
function main() {
  console.log('NURAL CORTEX — Extracting knowledge...');

  const skills = extractSkills();
  console.log(`  Skills: ${skills.length}`);

  const agents = extractAgents();
  console.log(`  Agents: ${agents.length}`);

  const reports = extractReports();
  console.log(`  Reports: ${reports.length}`);

  const courses = extractCourses();
  console.log(`  Courses: ${courses.length}`);

  const notes = extractObsidianNotes();
  console.log(`  Notes: ${notes.length}`);

  const lectures = extractLectures();
  console.log(`  Lectures: ${lectures.length}`);

  const nexusReports = extractNexusForge();
  console.log(`  NEXUS FORGE reports: ${nexusReports.length}`);
  const allReports = [...reports, ...nexusReports];

  console.log('Building graph...');
  const graph = buildGraph(skills, agents, allReports, courses, notes, lectures);
  console.log(`  Nodes: ${graph.nodes.length}`);
  console.log(`  Edges: ${graph.edges.length}`);

  // Domain summary
  const domainCounts = {};
  for (const skill of skills) {
    domainCounts[skill.domain] = (domainCounts[skill.domain] || 0) + 1;
  }
  console.log('  Domain distribution:', JSON.stringify(domainCounts));

  const output = {
    meta: {
      extractedAt: new Date().toISOString(),
      totalSkills: skills.length,
      totalAgents: agents.length,
      totalReports: allReports.length,
      totalCourses: courses.length,
      totalNotes: notes.length,
      totalLectures: lectures.length,
      totalNodes: graph.nodes.length,
      totalEdges: graph.edges.length,
    },
    skills,
    agents,
    reports: allReports,
    courses,
    notes,
    lectures,
    graph,
  };

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_FILE);
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nWritten to: ${OUTPUT_FILE}`);
  console.log(`File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB`);
}

main();
