// v13.0 split checker: the former single script now loads as ordered classic scripts sharing the global scope.
// Function declarations no longer hoist across files, so this lists every project identifier that load-time code
// uses before the file that declares it has run. "Load-time code" = top-level statements plus the bodies of
// functions those statements call (transitively). Run: node tools/split-check.mjs
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const acorn = require('./e2e/node_modules/acorn'), walk = require('./e2e/node_modules/acorn-walk');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const files = [...html.matchAll(/<script src="(src\/[^"]+)"><\/script>/g)].map((m) => m[1]);
const root = new URL('../', import.meta.url).pathname;
const decl = new Map();   // name → { file, line, kind }
const parsed = files.map((f) => {
  const src = fs.readFileSync(root + f, 'utf8');
  const ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'script', locations: true });
  const top = new Map();   // name → kind for this file
  for (const n of ast.body) {
    if (n.type === 'FunctionDeclaration') { top.set(n.id.name, 'function'); decl.set(n.id.name, { file: f, line: 0, kind: 'function' }); }
    else if (n.type === 'ClassDeclaration') { top.set(n.id.name, 'class'); decl.set(n.id.name, { file: f, line: n.loc.start.line, kind: 'class' }); }
    else if (n.type === 'VariableDeclaration') for (const d of n.declarations) { const names = []; (function ids(p) { if (!p) return; if (p.type === 'Identifier') names.push(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach((q) => ids(q.value || q.argument)); else if (p.type === 'ArrayPattern') p.elements.forEach(ids); else if (p.type === 'AssignmentPattern') ids(p.left); else if (p.type === 'RestElement') ids(p.argument); })(d.id); names.forEach((nm) => { top.set(nm, n.kind); decl.set(nm, { file: f, line: n.kind === 'var' ? 0 : n.loc.start.line, kind: n.kind }); }); }
  }
  return { f, src, ast, top };
});
const order = new Map(files.map((f, i) => [f, i]));
const problems = [];
for (const { f, ast, top } of parsed) {
  const fi = order.get(f);
  const fns = new Map(ast.body.filter((n) => n.type === 'FunctionDeclaration').map((n) => [n.id.name, n]));
  const seen = new Set();
  const scan = (node, where) => {
    walk.full(node, (n) => {
      if (n.type === 'Identifier' && decl.has(n.name)) {
        const d = decl.get(n.name);
        const later = order.get(d.file) > fi || (d.file === f && d.line > n.loc.start.line && d.kind !== 'function' && d.kind !== 'var');
        if (later) problems.push({ name: n.name, use: `${f}:${n.loc.start.line}`, from: `${d.file}${d.line ? ':' + d.line : ''}`, via: where });
      }
      if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && fns.has(n.callee.name) && !seen.has(n.callee.name)) { seen.add(n.callee.name); scan(fns.get(n.callee.name).body, n.callee.name + '()'); }
    });
  };
  for (const n of ast.body) if (n.type !== 'FunctionDeclaration' && n.type !== 'ClassDeclaration') scan(n, 'top');
}
const uniq = new Map(); problems.forEach((p) => { const k = p.name + '@' + p.use; if (!uniq.has(k)) uniq.set(k, p); });
const rows = [...uniq.values()];
console.log(`${files.length} files, ${decl.size} declarations, ${rows.length} forward references`);
const byName = new Map(); rows.forEach((p) => { const a = byName.get(p.name) || []; a.push(p); byName.set(p.name, a); });
for (const [name, ps] of [...byName].sort((a, b) => a[1].length - b[1].length || a[0].localeCompare(b[0]))) console.log(`${name.padEnd(22)} ← ${ps[0].from.padEnd(34)} used at ${ps.slice(0, 3).map((p) => p.use + (p.via === 'top' ? '' : ' (' + p.via + ')')).join(', ')}${ps.length > 3 ? ' +' + (ps.length - 3) : ''}`);
