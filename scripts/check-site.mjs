#!/usr/bin/env node

/**
 * Dependency-free checks for Hugo's rendered output.
 *
 * Usage:
 *   node scripts/check-site.mjs [output-directory]
 *
 * SITE_CHECK_FORBIDDEN_ROUTES can be set to a comma-separated list. Its
 * default protects privacy-sensitive unpublished routes; set it to an empty string
 * only when auditing an intentionally older local build.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Keep privacy-sensitive unpublished routes out of searchable repository text.
const DEFAULT_FORBIDDEN_ROUTE_HASHES = new Set([
  'c29b9a28710b9d27583195f7da0c694297fad09049d53b216f333085d01eb484',
  'dc1791a8e710a7d809f3edbca67564c1d7e9371904e534f7ee4ab13514da01f0',
]);

function routeHash(route) {
  return crypto.createHash('sha256').update(route).digest('hex');
}

function normalizeForbiddenRoute(value) {
  let route = value.startsWith('/') ? value : `/${value}`;
  if (!path.posix.extname(route) && !route.endsWith('/')) route += '/';
  return route;
}

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);
const RAW_TEXT_ELEMENTS = new Set(['script', 'style', 'template']);
const INTERACTIVE_ROLES = new Set([
  'button', 'checkbox', 'link', 'menuitem', 'menuitemcheckbox',
  'menuitemradio', 'option', 'radio', 'switch', 'tab', 'treeitem',
]);

const root = path.resolve(process.argv[2] || 'public');
const displayRoot = path.relative(process.cwd(), root) || '.';

if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`Site check failed: output directory does not exist: ${displayRoot}`);
  process.exit(2);
}

function listFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(absolute));
    if (entry.isFile()) files.push(absolute);
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function decodeEntities(value) {
  return value.replace(/&(#(?:x[\da-f]+|\d+)|[a-z][\da-z]+);/gi, (match, entity) => {
    const decodeCodePoint = (codePoint) => (
      Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : match
    );
    const normalized = entity.toLowerCase();
    if (normalized.startsWith('#x')) {
      return decodeCodePoint(Number.parseInt(normalized.slice(2), 16));
    }
    if (normalized.startsWith('#')) {
      return decodeCodePoint(Number.parseInt(normalized.slice(1), 10));
    }
    return ({
      amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
    })[normalized] ?? match;
  });
}

function parseAttributes(input, offset) {
  const attributes = new Map();
  let cursor = offset;

  while (cursor < input.length) {
    while (/\s/.test(input[cursor] || '')) cursor += 1;
    if (cursor >= input.length || input[cursor] === '/' || input[cursor] === '>') break;

    const nameStart = cursor;
    while (cursor < input.length && !/[\s=/>]/.test(input[cursor])) cursor += 1;
    const name = input.slice(nameStart, cursor).toLowerCase();
    while (/\s/.test(input[cursor] || '')) cursor += 1;

    let value = '';
    if (input[cursor] === '=') {
      cursor += 1;
      while (/\s/.test(input[cursor] || '')) cursor += 1;
      const quote = input[cursor];
      if (quote === '"' || quote === "'") {
        cursor += 1;
        const valueStart = cursor;
        while (cursor < input.length && input[cursor] !== quote) cursor += 1;
        value = input.slice(valueStart, cursor);
        if (input[cursor] === quote) cursor += 1;
      } else {
        const valueStart = cursor;
        while (cursor < input.length && !/[\s>]/.test(input[cursor])) cursor += 1;
        value = input.slice(valueStart, cursor);
      }
    }

    if (name && !attributes.has(name)) attributes.set(name, decodeEntities(value));
  }

  return attributes;
}

function parseDocument(source, relativePath) {
  const rootNode = {
    tag: '#document', attrs: new Map(), children: [], parent: null,
    text: [], offset: 0, line: 1,
  };
  const nodes = [];
  const stack = [rootNode];
  const lowerSource = source.toLowerCase();
  const newlines = [];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '\n') newlines.push(index);
  }

  function lineAt(offset) {
    let low = 0;
    let high = newlines.length;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (newlines[middle] < offset) low = middle + 1;
      else high = middle;
    }
    return low + 1;
  }

  function appendText(text) {
    if (text && !RAW_TEXT_ELEMENTS.has(stack.at(-1).tag)) stack.at(-1).text.push(text);
  }

  function findTagEnd(start) {
    let quote = null;
    for (let cursor = start + 1; cursor < source.length; cursor += 1) {
      const character = source[cursor];
      if (quote) {
        if (character === quote) quote = null;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') {
        return cursor;
      }
    }
    return source.length - 1;
  }

  let cursor = 0;
  while (cursor < source.length) {
    const current = stack.at(-1);
    if (RAW_TEXT_ELEMENTS.has(current.tag)) {
      const closing = lowerSource.indexOf(`</${current.tag}`, cursor);
      if (closing === -1) break;
      cursor = closing;
    }

    const opening = source.indexOf('<', cursor);
    if (opening === -1) {
      appendText(source.slice(cursor));
      break;
    }
    appendText(source.slice(cursor, opening));

    if (source.startsWith('<!--', opening)) {
      const commentEnd = source.indexOf('-->', opening + 4);
      cursor = commentEnd === -1 ? source.length : commentEnd + 3;
      continue;
    }

    const end = findTagEnd(opening);
    const token = source.slice(opening + 1, end);
    cursor = end + 1;
    if (/^\s*[!?]/.test(token)) continue;

    const closingMatch = token.match(/^\s*\/\s*([\w:-]+)/);
    if (closingMatch) {
      const closingTag = closingMatch[1].toLowerCase();
      for (let index = stack.length - 1; index > 0; index -= 1) {
        if (stack[index].tag === closingTag) {
          stack.length = index;
          break;
        }
      }
      continue;
    }

    const openingMatch = token.match(/^\s*([\w:-]+)/);
    if (!openingMatch) continue;
    const tag = openingMatch[1].toLowerCase();
    const node = {
      tag,
      attrs: parseAttributes(token, openingMatch[0].length),
      children: [],
      parent: stack.at(-1),
      text: [],
      offset: opening,
      line: lineAt(opening),
    };
    stack.at(-1).children.push(node);
    nodes.push(node);

    const trimmedToken = token.trimEnd();
    const trailingSlash = trimmedToken.endsWith('/');
    const beforeSlash = trailingSlash ? trimmedToken.at(-2) : '';
    const explicitlyClosed = trailingSlash
      && (openingMatch[0].trim().length === trimmedToken.length - 1 || /[\s"']/.test(beforeSlash));
    if (!VOID_ELEMENTS.has(tag) && !explicitlyClosed) stack.push(node);
  }

  const idNodes = new Map();
  const fragmentNames = new Set();
  for (const node of nodes) {
    if (node.attrs.has('id')) {
      const id = node.attrs.get('id');
      if (!idNodes.has(id)) idNodes.set(id, []);
      idNodes.get(id).push(node);
      fragmentNames.add(id);
    }
    if (node.tag === 'a' && node.attrs.has('name')) fragmentNames.add(node.attrs.get('name'));
  }

  return { source, relativePath, rootNode, nodes, idNodes, fragmentNames };
}

function collapsed(value) {
  return decodeEntities(value).replace(/\s+/g, ' ').trim();
}

function isHidden(node) {
  for (let current = node; current && current.tag !== '#document'; current = current.parent) {
    if (current.attrs.has('hidden') || current.attrs.get('aria-hidden')?.toLowerCase() === 'true') return true;
  }
  return false;
}

function visibleText(node) {
  if (isHidden(node) || RAW_TEXT_ELEMENTS.has(node.tag)) return '';
  const pieces = [...node.text];
  if (node.tag === 'img') pieces.push(node.attrs.get('alt') || '');
  for (const child of node.children) pieces.push(visibleText(child));
  return collapsed(pieces.join(' '));
}

function labelledByText(node, document) {
  const references = collapsed(node.attrs.get('aria-labelledby') || '').split(' ').filter(Boolean);
  return collapsed(references.map((id) => {
    const target = document.idNodes.get(id)?.[0];
    if (!target) return '';
    return target.attrs.get('aria-label') || visibleText(target);
  }).join(' '));
}

function wrappingLabelText(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (current.tag === 'label') return visibleText(current);
  }
  return '';
}

function associatedLabelText(node, document) {
  const id = node.attrs.get('id');
  if (!id) return wrappingLabelText(node);
  const explicit = document.nodes
    .filter((candidate) => candidate.tag === 'label' && candidate.attrs.get('for') === id)
    .map(visibleText)
    .join(' ');
  return collapsed(`${explicit} ${wrappingLabelText(node)}`);
}

function accessibleName(node, document) {
  const ariaLabel = collapsed(node.attrs.get('aria-label') || '');
  if (ariaLabel) return ariaLabel;
  const labelledBy = labelledByText(node, document);
  if (labelledBy) return labelledBy;

  if (['input', 'select', 'textarea'].includes(node.tag)) {
    const label = associatedLabelText(node, document);
    if (label) return label;
    const type = (node.attrs.get('type') || 'text').toLowerCase();
    if (type === 'image') return collapsed(node.attrs.get('alt') || '');
    if (type === 'button') return collapsed(node.attrs.get('value') || '');
    if (type === 'submit') return collapsed(node.attrs.get('value') || 'Submit');
    if (type === 'reset') return collapsed(node.attrs.get('value') || 'Reset');
  }

  if (node.tag === 'area') return collapsed(node.attrs.get('alt') || '');

  const text = visibleText(node);
  if (text) return text;
  return collapsed(node.attrs.get('title') || '');
}

function landmarkName(node, document) {
  return collapsed(node.attrs.get('aria-label') || '')
    || labelledByText(node, document)
    || collapsed(node.attrs.get('title') || '');
}

function isInteractive(node) {
  if (node.tag === 'a' || node.tag === 'area') return node.attrs.has('href');
  if (['button', 'select', 'textarea', 'summary'].includes(node.tag)) return true;
  if (node.tag === 'input') return (node.attrs.get('type') || 'text').toLowerCase() !== 'hidden';
  const roles = (node.attrs.get('role') || '').toLowerCase().split(/\s+/);
  if (roles.some((role) => INTERACTIVE_ROLES.has(role))) return true;
  return node.attrs.has('tabindex') && node.attrs.get('tabindex') !== '-1';
}

function canonicalNode(document) {
  return document.nodes.find((node) => node.tag === 'link'
    && (node.attrs.get('rel') || '').toLowerCase().split(/\s+/).includes('canonical'));
}

function documentRoute(relativePath) {
  const portable = relativePath.split(path.sep).join('/');
  if (portable === 'index.html') return '/';
  if (portable.endsWith('/index.html')) return `/${portable.slice(0, -'index.html'.length)}`;
  return `/${portable}`;
}

const allFiles = listFiles(root);
const htmlFiles = allFiles.filter((file) => file.toLowerCase().endsWith('.html'));
if (htmlFiles.length === 0) {
  console.error(`Site check failed: no HTML documents found under ${displayRoot}`);
  process.exit(2);
}

const documents = htmlFiles.map((absolutePath) => {
  const relativePath = path.relative(root, absolutePath);
  const document = parseDocument(fs.readFileSync(absolutePath, 'utf8'), relativePath);
  document.absolutePath = absolutePath;
  document.route = documentRoute(relativePath);
  document.canonical = canonicalNode(document)?.attrs.get('href') || '';
  return document;
});

const filesByAbsolutePath = new Map(allFiles.map((file) => [path.resolve(file), file]));
const documentsByFile = new Map(documents.map((document) => [path.resolve(document.absolutePath), document]));
const routeFiles = new Map();
for (const file of allFiles) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  routeFiles.set(`/${relative}`, file);
  if (relative === 'index.html') routeFiles.set('/', file);
  if (relative.endsWith('/index.html')) routeFiles.set(`/${relative.slice(0, -'index.html'.length)}`, file);
}

const rootDocument = documents.find((document) => document.relativePath === 'index.html');
let canonicalOrigin = 'https://site-check.invalid';
let basePath = '/';
if (rootDocument?.canonical) {
  try {
    const canonical = new URL(rootDocument.canonical, canonicalOrigin);
    canonicalOrigin = canonical.origin;
    basePath = canonical.pathname.endsWith('/') ? canonical.pathname : `${path.posix.dirname(canonical.pathname)}/`;
  } catch {
    // The metadata check below reports the unusable canonical URL.
  }
}
const localOrigins = new Set([canonicalOrigin]);
for (const document of documents) {
  try {
    localOrigins.add(new URL(document.canonical).origin);
  } catch {
    // Relative and malformed canonical values are handled elsewhere.
  }
}

function deployedPath(route) {
  if (basePath === '/') return route;
  return `${basePath.replace(/\/$/, '')}${route}`;
}

for (const document of documents) {
  document.deployedUrl = new URL(deployedPath(document.route), `${canonicalOrigin}/`);
}

const issues = [];
const statistics = { localReferences: 0, fragments: 0 };

function addIssue(document, node, rule, detail) {
  issues.push({
    file: document?.relativePath || '.',
    line: node?.line || 1,
    rule,
    detail,
  });
}

function normalizeLocalPath(urlPath) {
  let pathname = urlPath;
  if (basePath !== '/' && pathname.startsWith(basePath)) pathname = `/${pathname.slice(basePath.length)}`;
  try {
    return decodeURIComponent(pathname);
  } catch {
    return null;
  }
}

function findLocalTarget(url) {
  const pathname = normalizeLocalPath(url.pathname);
  if (pathname === null || pathname.includes('\0')) return null;
  const routeMatch = routeFiles.get(pathname);
  if (routeMatch) return routeMatch;

  const relative = pathname.replace(/^\/+/, '');
  const candidate = path.resolve(root, relative);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return null;
  if (filesByAbsolutePath.has(candidate)) return candidate;
  if (filesByAbsolutePath.has(path.join(candidate, 'index.html'))) return path.join(candidate, 'index.html');
  return null;
}

function checkReference(document, node, attribute) {
  const raw = collapsed(node.attrs.get(attribute) || '');
  if (!raw && attribute === 'src') {
    addIssue(document, node, 'local-target', `<${node.tag}> has an empty ${attribute}`);
    return;
  }
  if (/^(?:data|blob|mailto|tel|javascript):/i.test(raw)) return;

  let url;
  try {
    url = new URL(raw, document.deployedUrl);
  } catch {
    addIssue(document, node, 'local-target', `invalid ${attribute}=${JSON.stringify(raw)}`);
    return;
  }
  if (!['http:', 'https:'].includes(url.protocol) || !localOrigins.has(url.origin)) return;

  statistics.localReferences += 1;
  const target = findLocalTarget(url);
  if (!target) {
    addIssue(document, node, 'local-target', `${attribute}=${JSON.stringify(raw)} does not resolve`);
    return;
  }

  if (attribute !== 'href' || !url.hash) return;
  const targetDocument = documentsByFile.get(path.resolve(target));
  if (!targetDocument) return;
  statistics.fragments += 1;
  let fragment;
  try {
    fragment = decodeURIComponent(url.hash.slice(1));
  } catch {
    addIssue(document, node, 'fragment', `invalid fragment in href=${JSON.stringify(raw)}`);
    return;
  }
  if (fragment && !targetDocument.fragmentNames.has(fragment)) {
    addIssue(document, node, 'fragment', `href=${JSON.stringify(raw)} has no matching target`);
  }
}

for (const document of documents) {
  const html = document.nodes.find((node) => node.tag === 'html');
  if (!html || !collapsed(html.attrs.get('lang') || '')) {
    addIssue(document, html, 'document-lang', '<html> needs a non-empty lang attribute');
  }

  const title = document.nodes.find((node) => node.tag === 'title');
  if (!title || !visibleText(title)) addIssue(document, title, 'document-title', '<title> must not be empty');

  const mains = document.nodes.filter((node) => node.tag === 'main'
    || (node.attrs.get('role') || '').toLowerCase().split(/\s+/).includes('main'));
  if (mains.length !== 1) {
    addIssue(document, mains[0], 'main-landmark', `expected exactly one main landmark; found ${mains.length}`);
  }

  for (const [id, nodes] of document.idNodes) {
    if (nodes.length > 1) addIssue(document, nodes[1], 'duplicate-id', `id=${JSON.stringify(id)} occurs ${nodes.length} times`);
  }

  for (const image of document.nodes.filter((node) => node.tag === 'img')) {
    const presentation = collapsed(image.attrs.get('role') || '').toLowerCase() === 'presentation';
    if (!presentation && (!image.attrs.has('alt') || !collapsed(image.attrs.get('alt')))) {
      addIssue(document, image, 'image-alt', '<img> needs non-empty alt text or role="presentation"');
    }
  }

  for (const nav of document.nodes.filter((node) => node.tag === 'nav' && !isHidden(node))) {
    if (!landmarkName(nav, document)) addIssue(document, nav, 'accessible-name', '<nav> needs an accessible name');
  }
  for (const control of document.nodes.filter((node) => isInteractive(node) && !isHidden(node))) {
    if (!accessibleName(control, document)) {
      addIssue(document, control, 'accessible-name', `<${control.tag}> needs an accessible name`);
    }
  }

  const canonical = canonicalNode(document);
  if (!canonical || !collapsed(canonical.attrs.get('href') || '')) {
    addIssue(document, canonical, 'canonical', 'canonical link metadata is missing or empty');
  } else {
    try {
      new URL(canonical.attrs.get('href'), document.deployedUrl);
    } catch {
      addIssue(document, canonical, 'canonical', 'canonical link metadata is not a valid URL');
    }
  }

  const description = document.nodes.find((node) => node.tag === 'meta'
    && (node.attrs.get('name') || '').toLowerCase() === 'description');
  if (!description || !collapsed(description.attrs.get('content') || '')) {
    addIssue(document, description, 'description', 'meta description is missing or empty');
  }

  const ogImage = document.nodes.find((node) => node.tag === 'meta'
    && (node.attrs.get('property') || '').toLowerCase() === 'og:image');
  if (!ogImage || !collapsed(ogImage.attrs.get('content') || '')) {
    addIssue(document, ogImage, 'og-image', 'Open Graph image metadata is missing or empty');
  }

  for (const node of document.nodes) {
    if (node.attrs.has('href')) checkReference(document, node, 'href');
    if (node.attrs.has('src')) checkReference(document, node, 'src');
  }
}

const forbiddenSetting = process.env.SITE_CHECK_FORBIDDEN_ROUTES;
if (forbiddenSetting === undefined) {
  for (const route of routeFiles.keys()) {
    if (DEFAULT_FORBIDDEN_ROUTE_HASHES.has(routeHash(route))) {
      addIssue(null, null, 'forbidden-route', 'a privacy-sensitive route was emitted but is configured to remain unpublished');
    }
  }
} else {
  const forbiddenRoutes = forbiddenSetting.split(',')
    .map((route) => route.trim())
    .filter(Boolean)
    .map(normalizeForbiddenRoute);
  for (const route of forbiddenRoutes) {
    if (routeFiles.has(route) || routeFiles.has(`${route}index.html`)) {
      addIssue(null, null, 'forbidden-route', `${route} was emitted but is configured to remain unpublished`);
    }
  }
}

issues.sort((left, right) => left.file.localeCompare(right.file)
  || left.line - right.line
  || left.rule.localeCompare(right.rule)
  || left.detail.localeCompare(right.detail));

if (issues.length > 0) {
  const maximum = Number.parseInt(process.env.SITE_CHECK_MAX_FAILURES || '100', 10);
  console.error(`Site check failed: ${issues.length} issue(s) in ${htmlFiles.length} HTML document(s)`);
  for (const issue of issues.slice(0, maximum)) {
    console.error(`FAIL ${issue.file}:${issue.line} [${issue.rule}] ${issue.detail}`);
  }
  if (issues.length > maximum) console.error(`... ${issues.length - maximum} additional issue(s) omitted`);
  process.exit(1);
}

console.log(
  `Site check passed: ${htmlFiles.length} HTML document(s), `
  + `${statistics.localReferences} local reference(s), ${statistics.fragments} fragment link(s).`,
);
