import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const projectRoot = process.cwd();
const routesPath = path.join(projectRoot, 'src', 'routes');
const localesPath = path.join(projectRoot, 'src', 'locales');
const newLocalesPath = path.join(projectRoot, 'src', 'locales-new');

const i18nKeyInCodeRegex = /t\(\s*['"`]([^'"`]+?)['"`]/g;
const i18nKeyInLocaleFileRegex = /^\s*([a-zA-Z0-9_]+)\s*:/;
const tFunctionWithDefaultRegex =
  /t\(\s*['"`]([^'"`]+?)['"`],\s*['"`]([^'"`]+?)['"`]/g;

async function extractKeysFromCode() {
  const files = await glob(`${routesPath}/**/*.{ts,tsx}`);
  const usedKeys = new Set();
  const keysWithDefaults = new Map();
  const keyUsage = new Map(); // Map<string, Set<string>>

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    let match;

    while ((match = i18nKeyInCodeRegex.exec(content)) !== null) {
      const key = match[1];
      usedKeys.add(key);
      if (!keyUsage.has(key)) {
        keyUsage.set(key, new Set());
      }
      keyUsage.get(key).add(file);
    }

    // Reset regex for the next loop
    tFunctionWithDefaultRegex.lastIndex = 0;
    while ((match = tFunctionWithDefaultRegex.exec(content)) !== null) {
      const key = match[1];
      const defaultValue = match[2];
      if (!keysWithDefaults.has(key)) {
        keysWithDefaults.set(key, defaultValue);
      }
    }
  }

  return { usedKeys, keysWithDefaults, keyUsage };
}

async function parseLocaleFile(filePath) {
  const translations = new Map();
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    // This is a simplified parser. It might not handle all edge cases.
    // It looks for `key: 'value',` or `key: "value",`
    const regex = /^\s*([a-zA-Z0-9_]+)\s*:\s*['"`](.*?)['"`],?$/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
      // Replace escaped quotes
      const value = match[2].replace(/\'/g, "'").replace(/\"/g, '"');
      translations.set(match[1], value);
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Error reading locale file ${filePath}:`, error);
    }
  }
  return translations;
}

function getFeatureFromFilePath(filePath) {
  const relativePath = path.relative(routesPath, filePath);
  const parts = relativePath.split(path.sep);
  if (parts[0]) {
    if (parts[0] === '-components') return 'components';
    if (parts[0] === '__root.tsx' || parts[0] === 'index.tsx') return 'home';
    return parts[0];
  }
  return 'common';
}

async function reorganizeLocales(keyUsage, allTranslations, keysWithDefaults) {
  console.log('\n--- Starting Locale Reorganization ---');

  const featureKeyMap = new Map(); // Map<string, Set<string>>

  for (const [key, files] of keyUsage.entries()) {
    const features = new Set();
    for (const file of files) {
      features.add(getFeatureFromFilePath(file));
    }

    const feature =
      features.size > 1 ? 'common' : features.values().next().value;

    if (!featureKeyMap.has(feature)) {
      featureKeyMap.set(feature, new Set());
    }
    featureKeyMap.get(feature).add(key);
  }

  for (const lang of ['zh-CN', 'en-US']) {
    const langPath = path.join(newLocalesPath, lang);
    await fs.mkdir(langPath, { recursive: true });
    const langTranslations = allTranslations[lang];
    const moduleNames = [];

    for (const [feature, keys] of featureKeyMap.entries()) {
      let content = 'export default {\n';
      const sortedKeys = Array.from(keys).sort();

      for (const key of sortedKeys) {
        let translation = langTranslations.get(key);
        if (translation === undefined) {
          const defaultValue = keysWithDefaults.get(key) || '';
          if (lang === 'en-US') {
            translation = defaultValue;
          } else {
            translation = `TRANSLATE_ME: ${defaultValue}`;
          }
        }
        // Escape single quotes in the translation
        const escapedTranslation = translation
          .replace(/'/g, "'\\")
          .replace(/"/g, '\"');
        content += `  '${key}': '${escapedTranslation}',\n`;
      }
      content += '};\n';

      const moduleName = feature.replace(/-/g, '_');
      const filePath = path.join(langPath, `${moduleName}.ts`);
      await fs.writeFile(filePath, content);
      moduleNames.push(moduleName);
      console.log(
        `  - Wrote ${sortedKeys.length} keys to ${path.relative(projectRoot, filePath)}`
      );
    }

    // Create index.ts for the language
    let indexContent = moduleNames
      .map((name) => `import ${name} from './routes/${name}';`)
      .join('\n');
    indexContent += '\n\nexport default {\n';
    indexContent += moduleNames.map((name) => `  ...${name},`).join('\n');
    indexContent += '\n};\n';
    await fs.writeFile(
      path.join(newLocalesPath, lang, 'index.ts'),
      indexContent
    );
    console.log(`\nCreated index file for ${lang}`);
  }
  console.log('\n--- Reorganization Complete ---');
  console.log(
    `\nNew locale files have been generated in: ${path.relative(projectRoot, newLocalesPath)}`
  );
  console.log(
    "Please review the new files and replace the old 'src/locales' directory if everything is correct."
  );
}

async function main() {
  try {
    console.log('--- Starting i18n Analysis ---');

    const { usedKeys, keysWithDefaults, keyUsage } =
      await extractKeysFromCode();

    const zhLocalePath = path.join(localesPath, 'zh-CN', 'index.ts');
    const enLocalePath = path.join(localesPath, 'en-US', 'index.ts');

    const zhTranslations = await parseLocaleFile(zhLocalePath);
    const enTranslations = await parseLocaleFile(enLocalePath);
    if (!enTranslations.size) {
      // If en-US is empty, try reading from src/locales/en-US/index.ts
      const enUsIndex = path.join(localesPath, 'en-US', 'index.ts');
      const enUsTranslations = await parseLocaleFile(enUsIndex);
      enUsTranslations.forEach((value, key) => enTranslations.set(key, value));
    }

    const definedZhKeys = new Set(zhTranslations.keys());
    const definedEnKeys = new Set(enTranslations.keys());

    const unusedZhKeys = new Set(
      [...definedZhKeys].filter((k) => !usedKeys.has(k))
    );
    const missingZhKeys = new Set(
      [...usedKeys].filter((k) => !definedZhKeys.has(k))
    );
    const unusedEnKeys = new Set(
      [...definedEnKeys].filter((k) => !usedKeys.has(k))
    );
    const missingEnKeys = new Set(
      [...usedKeys].filter((k) => !definedEnKeys.has(k))
    );

    console.log('\n--- Analysis Report ---');
    if (unusedZhKeys.size > 0) {
      console.log(`\n[INFO] ${unusedZhKeys.size} UNUSED keys found in zh-CN:`);
      console.log(
        Array.from(unusedZhKeys)
          .sort()
          .map((k) => `- ${k}`)
          .join('\n')
      );
    }
    if (missingZhKeys.size > 0) {
      console.log(`\n[WARNING] ${missingZhKeys.size} MISSING keys in zh-CN:`);
      console.log(
        Array.from(missingZhKeys)
          .sort()
          .map((k) => `- ${k}`)
          .join('\n')
      );
    }
    if (unusedEnKeys.size > 0) {
      console.log(`\n[INFO] ${unusedEnKeys.size} UNUSED keys found in en-US:`);
      console.log(
        Array.from(unusedEnKeys)
          .sort()
          .map((k) => `- ${k}`)
          .join('\n')
      );
    }
    if (missingEnKeys.size > 0) {
      console.log(`\n[WARNING] ${missingEnKeys.size} MISSING keys in en-US:`);
      console.log(
        Array.from(missingEnKeys)
          .sort()
          .map((k) => `- ${k}`)
          .join('\n')
      );
    }

    if (
      unusedZhKeys.size === 0 &&
      missingZhKeys.size === 0 &&
      unusedEnKeys.size === 0 &&
      missingEnKeys.size === 0
    ) {
      console.log('\n[SUCCESS] All locales are in sync with the codebase!');
    }

    await reorganizeLocales(
      keyUsage,
      { 'zh-CN': zhTranslations, 'en-US': enTranslations },
      keysWithDefaults
    );
  } catch (error) {
    console.error('\nAn error occurred during analysis:', error);
  }
}

main();
