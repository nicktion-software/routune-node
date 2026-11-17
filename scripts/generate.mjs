// Generates src/generated/openapi.ts from openapi/routune-public.v1.json.
//   node scripts/generate.mjs           write the file
//   node scripts/generate.mjs --check   fail if the committed file is out of date (CI)
//   node scripts/generate.mjs --from ../DMS_APP/openapi/routune-public.v1.json
//                                       copy a newer spec in first
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const specPath = resolve(root, 'openapi/routune-public.v1.json');
const outPath = resolve(root, 'src/generated/openapi.ts');

const args = process.argv.slice(2);
const fromIdx = args.indexOf('--from');
if (fromIdx !== -1) copyFileSync(resolve(args[fromIdx + 1]), specPath);

const spec = JSON.parse(readFileSync(specPath, 'utf8'));
const ast = await openapiTS(spec, { exportType: false, alphabetize: true });
const header = `// Generated from openapi/routune-public.v1.json (API ${spec.info.version}) by scripts/generate.mjs.\n// Do not edit by hand: run \`npm run generate\`.\n/* eslint-disable */\n\n`;
const output = header + astToString(ast);

if (args.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(outPath, 'utf8');
  } catch {
    // missing
  }
  if (current.replace(/\r\n/g, '\n') !== output) {
    console.error('src/generated/openapi.ts is out of date. Run `npm run generate` and commit the result.');
    process.exit(1);
  }
  console.log('Generated types are up to date.');
} else {
  writeFileSync(outPath, output);
  console.log(`Wrote ${outPath}`);
}
