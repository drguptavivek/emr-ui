/**
 * Extracts Inputs (props) and Outputs (events) for every component in
 * packages/emr-ui/catalog.manifest.ts using the TypeScript AST and writes
 * packages/emr-react/harness/gallery/component-api-manifest.ts.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = join(rootDir, 'packages/emr-ui/catalog.manifest.ts');
const outPath = join(rootDir, 'packages/emr-react/harness/gallery/component-api-manifest.ts');

// Parse catalog.manifest.ts to map selector -> { id, file }
const manifestSource = ts.createSourceFile(
  manifestPath,
  readFileSync(manifestPath, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);

const entries = [];
function collectCatalogEntries(node) {
  if (ts.isObjectLiteralExpression(node)) {
    const props = {};
    for (const p of node.properties) {
      if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) {
        if (ts.isStringLiteral(p.initializer)) {
          props[p.name.text] = p.initializer.text;
        }
      }
    }
    if (props.id && props.file) {
      const slug =
        props.selector ||
        props.id
          .replace(/(?:Component|Directive)$/, '')
          .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
          .toLowerCase();
      if (props.selector || props.id === 'EmrClinicalCellRendererDirective') {
        entries.push({ ...props, selector: slug });
      }
    }
  }
  ts.forEachChild(node, collectCatalogEntries);
}
collectCatalogEntries(manifestSource);

const fileCache = new Map();
function getSourceFile(relFile) {
  const abs = join(rootDir, 'packages/emr-ui/src/lib', relFile);
  if (!fileCache.has(abs)) {
    fileCache.set(
      abs,
      ts.createSourceFile(abs, readFileSync(abs, 'utf8'), ts.ScriptTarget.Latest, true),
    );
  }
  return fileCache.get(abs);
}

function getDecoratorName(dec) {
  const expr = dec.expression;
  if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) return expr.expression.text;
  if (ts.isIdentifier(expr)) return expr.text;
  return '';
}

function extractClassApi(sf, className, visited = new Set()) {
  const inputs = [];
  const outputs = [];
  const seenIn = new Set();
  const seenOut = new Set();

  function visit(node) {
    if (ts.isClassDeclaration(node) && node.name?.text === className) {
      // Include inherited inputs/outputs from same-file base classes (e.g. EmrSignalFieldBase)
      if (node.heritageClauses) {
        for (const hc of node.heritageClauses) {
          for (const t of hc.types) {
            const baseName = t.expression.getText(sf);
            if (!visited.has(baseName)) {
              visited.add(baseName);
              const baseApi = extractClassApi(sf, baseName, visited);
              for (const i of baseApi.inputs) {
                if (!seenIn.has(i.name)) {
                  seenIn.add(i.name);
                  inputs.push(i);
                }
              }
              for (const o of baseApi.outputs) {
                if (!seenOut.has(o.name)) {
                  seenOut.add(o.name);
                  outputs.push(o);
                }
              }
            }
          }
        }
      }

      for (const member of node.members) {
        if (!ts.isPropertyDeclaration(member) && !ts.isSetAccessorDeclaration(member)) continue;
        const name = ts.isIdentifier(member.name) ? member.name.text : member.name.getText(sf);
        const decorators = ts.getDecorators?.(member) ?? [];
        const hasInputDec = decorators.some((d) => getDecoratorName(d) === 'Input');
        const hasOutputDec = decorators.some((d) => getDecoratorName(d) === 'Output');

        if (ts.isSetAccessorDeclaration(member)) {
          if (hasInputDec && !seenIn.has(name)) {
            seenIn.add(name);
            const param = member.parameters[0];
            inputs.push({
              name,
              type: param?.type ? param.type.getText(sf) : 'unknown',
              required: false,
            });
          }
          continue;
        }

        const init = member.initializer;
        const initText = init ? init.getText(sf) : '';

        // Signal input(): input<T>(default) or input.required<T>() or input(false, ...)
        if (init && ts.isCallExpression(init)) {
          const calleeText = init.expression.getText(sf);
          if (calleeText === 'input' || calleeText === 'input.required') {
            if (!seenIn.has(name)) {
              seenIn.add(name);
              const required = calleeText === 'input.required';
              const typeArg = init.typeArguments?.[0]?.getText(sf);
              const defArg = !required && init.arguments[0] ? init.arguments[0].getText(sf) : undefined;
              inputs.push({
                name,
                type: typeArg ?? (defArg === 'false' || defArg === 'true' ? 'boolean' : defArg === "''" ? 'string' : 'unknown'),
                required,
                ...(defArg !== undefined ? { defaultValue: defArg } : {}),
              });
            }
            continue;
          }
          if (calleeText === 'output') {
            if (!seenOut.has(name)) {
              seenOut.add(name);
              const typeArg = init.typeArguments?.[0]?.getText(sf) ?? 'void';
              outputs.push({ name, type: typeArg });
            }
            continue;
          }
        }

        // Decorator @Input()
        if (hasInputDec && !seenIn.has(name)) {
          seenIn.add(name);
          const typeText = member.type ? member.type.getText(sf) : 'unknown';
          inputs.push({
            name,
            type: typeText,
            required: Boolean(member.exclamationToken),
            ...(initText ? { defaultValue: initText } : {}),
          });
        }

        // Decorator @Output()
        if (hasOutputDec && !seenOut.has(name)) {
          seenOut.add(name);
          let typeText = 'unknown';
          if (init && ts.isNewExpression(init) && init.typeArguments?.[0]) {
            typeText = init.typeArguments[0].getText(sf);
          } else if (member.type) {
            typeText = member.type.getText(sf);
          }
          outputs.push({ name, type: typeText });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return { inputs, outputs };
}

const apiMap = {};
for (const entry of entries) {
  try {
    const sf = getSourceFile(entry.file);
    apiMap[entry.selector] = extractClassApi(sf, entry.id);
  } catch {
    apiMap[entry.selector] = { inputs: [], outputs: [] };
  }
}

const banner = '// Auto-generated by scripts/build-component-api.mjs — do not edit by hand.\n';
const body = `export interface ComponentPropDoc {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly defaultValue?: string;
}

export interface ComponentEventDoc {
  readonly name: string;
  readonly type: string;
}

export interface ComponentApiDoc {
  readonly inputs: readonly ComponentPropDoc[];
  readonly outputs: readonly ComponentEventDoc[];
}

export const EMR_COMPONENT_API: Readonly<Record<string, ComponentApiDoc>> = ${JSON.stringify(apiMap, null, 2)};
`;

writeFileSync(outPath, banner + body, 'utf8');
console.log(`Generated API docs for ${Object.keys(apiMap).length} components -> component-api-manifest.ts`);
