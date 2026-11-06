import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contrastRatio, createSyntaxRules, jsonTokenLanguage, syntaxPalettes, withCallableTokens } from '../src/lib/syntaxPalette.ts';
import { themePresets } from '../src/lib/themes.ts';

// Monaco matches the most specific dot-delimited token prefix.
function colorFor(token: string, mode: 'light' | 'dark' = 'dark', background = '#0b0d0f', foreground = '#f8f8f2') {
  const rules = createSyntaxRules(mode, background, foreground);
  return rules.filter(rule => rule.foreground && (!rule.token || token === rule.token || token.startsWith(`${rule.token}.`)))
    .sort((a, b) => b.token.length - a.token.length)[0]?.foreground;
}

test('Canvas dark syntax uses supplied palette colors and distinguishes lexical roles', () => {
  const expected: Record<string, string> = {
    'identifier.ts': '9cdcfe', 'variable.shell': '9cdcfe',
    'keyword.js': '9580ff', 'keyword.flow.sql': '9580ff',
    'string.python': 'ffff80', 'string.escape.js': 'ffff80',
    'number.float.cpp': 'ff9580', 'comment.doc.java': '8aa4bd',
    'type.identifier.ts': 'bfb3ff', 'keyword.type.rust': 'bfb3ff',
    'function.predefined.go': '80ffea', 'predefined.sql': '80ffea',
    'type.identifier.shell': '80ffea', 'type.yaml': '80ffea',
    'key.json': '80ffea', 'string.key.json': '80ffea',
    'attribute.name.html': '80ffea', 'attribute.value.html': 'ffff80',
  };
  for (const [token, expectedColor] of Object.entries(expected)) assert.equal(colorFor(token), expectedColor, token);
  assert.equal(colorFor('unclassified'), syntaxPalettes.dark.text.slice(1));
});

test('syntax colors have readable contrast on every preset and on custom backgrounds', () => {
  for (const mode of ['light', 'dark'] as const) {
    const backgrounds = [...themePresets.map(preset => preset.colors[mode].background), '#ffffff', '#000000', '#777777', '#123456', '#abcdef'];
    for (const background of backgrounds) {
      for (const rule of createSyntaxRules(mode, background, '#123abc')) {
        if (!rule.foreground || ['', 'metatag.content'].includes(rule.token)) continue;
        assert.ok(contrastRatio(`#${rule.foreground}`, background) >= 4.5, `${mode} ${background} ${rule.token}`);
      }
    }
  }
});

test('custom foreground stays exact for plain text while identifiers have their own color', () => {
  for (const token of ['', 'unclassified', 'metatag.content']) {
    assert.equal(colorFor(token, 'light', '#ffffff', '#123abc'), '123abc');
  }
  assert.notEqual(colorFor('identifier.js', 'light', '#ffffff', '#123abc'), '123abc');
  assert.notEqual(colorFor('variable.shell'), colorFor(''));
});

test('JSON lexical rules distinguish keys, strings, numbers and keywords', () => {
  const rules = jsonTokenLanguage.tokenizer.root;
  const tokenFor = (source: string) => {
    for (const rule of rules) {
      if (!Array.isArray(rule)) continue;
      const [regex, token] = rule;
      if (regex instanceof RegExp && new RegExp(`^(?:${regex.source})`).test(source)) return token;
    }
  };
  assert.equal(tokenFor('"escaped\\"key": 12'), 'key');
  assert.equal(tokenFor('"key"   : true'), 'key');
  assert.equal(tokenFor('"value"'), 'string');
  assert.equal(tokenFor('-1.5e+2'), 'number');
  for (const word of ['true', 'false', 'null']) assert.equal(tokenFor(word), 'keyword');
  assert.equal(tokenFor('falsehood'), undefined);
  assert.equal(tokenFor(':'), 'delimiter');
});

test('bundled Monarch tokenizers emit categories covered by the theme', async () => {
  const { registerHooks } = await import('node:module');
  // Grammars import editor.api only for configuration enums. Supply those real
  // enums without loading browser CSS/DOM; tokenizer and grammar code stay real.
  const enumsUrl = import.meta.resolve('monaco-editor/editor/common/standalone/standaloneEnums.js');
  const hook = registerHooks({
    load(url, context, nextLoad) {
      if (url.endsWith('/editor/editor.api.js')) return {
        format: 'module', shortCircuit: true,
        source: `export * as languages from ${JSON.stringify(enumsUrl)}`,
      };
      return nextLoad(url, context);
    },
  });
  try {
    const { compile } = await import('monaco-editor/editor/standalone/common/monarch/monarchCompile.js');
    const { MonarchTokenizer } = await import('monaco-editor/editor/standalone/common/monarch/monarchLexer.js');
    const { TokenTheme } = await import('monaco-editor/editor/common/languages/supports/tokenization.js');
    const { TokenMetadata } = await import('monaco-editor/editor/common/encodedTokenAttributes.js');
    const theme = TokenTheme.createFromRawTokenTheme(createSyntaxRules('dark', '#0b0d0f', '#f8f8f2'), []);
    const samples: Record<string, [string, string[]]> = {
      javascript: ['const message = greet("hello"); // comment', ['keyword.js', 'identifier.js', 'function.js', 'string.js', 'comment.js']],
      typescript: ['const value: Widget = build(42);', ['keyword.ts', 'identifier.ts', 'function.ts', 'type.identifier.ts', 'number.ts']],
      python: ['value = greet("hello") # comment', ['identifier.python', 'function.python', 'string.python', 'comment.python']],
      java: ['int count = 42; // comment', ['keyword.int.java', 'identifier.java', 'number.java', 'comment.java']],
      cpp: ['int count = 42; // comment', ['keyword.int.cpp', 'identifier.cpp', 'number.cpp', 'comment.cpp']],
      go: ['var count = 42 // comment', ['keyword.var.go', 'identifier.go', 'number.go', 'comment.go']],
      rust: ['let count: i32 = 42; // comment', ['keyword.rust', 'identifier.rust', 'keyword.type.rust', 'number.rust', 'comment.rust']],
      html: ['<div title="hello">', ['tag.html', 'attribute.name.html', 'attribute.value.html']],
      css: ['a { color: "red"; }', ['tag.css', 'attribute.name.css', 'string.css']],
      sql: ["SELECT COUNT(*) FROM things WHERE id = 42 -- comment", ['keyword.sql', 'predefined.sql', 'identifier.sql', 'number.sql', 'comment.sql']],
      shell: ['echo $HOME # comment', ['type.identifier.shell', 'variable.shell', 'comment.shell']],
      yaml: ['name: "hello" # comment', ['type.yaml', 'string.yaml', 'comment.yaml']],
      markdown: ['# Heading', ['keyword.md']],
      json: ['{"name":"hello","count":42,"active":true}', ['key.json', 'string.json', 'number.json', 'keyword.json']],
    };
    for (const [id, [source, expected]] of Object.entries(samples)) {
      const bundledGrammar = id === 'json' ? jsonTokenLanguage : (await import(`monaco-editor/languages/definitions/${id}/${id}.js`)).language;
      const grammar = ['javascript', 'typescript', 'python'].includes(id) ? withCallableTokens(bundledGrammar) : bundledGrammar;
      const tokenizer = new MonarchTokenizer(
        { isRegisteredLanguageId: () => false }, {}, id, compile(id, grammar),
        { getValue: () => 10000, onDidChangeConfiguration: () => ({ dispose() {} }) },
      );
      try {
        const tokens = tokenizer.tokenize(source, true, tokenizer.getInitialState()).tokens;
        const emittedColor = (category: string) => theme.getColorMap()[TokenMetadata.getForeground(theme.match(1, category))].toString().toLowerCase();
        if (['javascript', 'typescript', 'python'].includes(id)) {
          const postfix = id === 'javascript' ? 'js' : id === 'typescript' ? 'ts' : 'python';
          assert.notEqual(emittedColor(`identifier.${postfix}`), emittedColor(`function.${postfix}`));
          // Keywords before parentheses, strings and comments must keep their roles.
          const guardTokens = tokenizer.tokenize('if (value) greet("call()")', true, tokenizer.getInitialState()).tokens;
          assert.ok(guardTokens.some(token => token.type === `keyword.${postfix}`));
          assert.ok(guardTokens.some(token => token.type === `string.${postfix}`));
        }
        if (id === 'markdown') {
          const lines = [
            '- `.memory/state/`: store current verified facts...',
            '## Heading', '*emphasis* and **strong**', '> quote',
            '[label](https://example.com)', '---', '***',
          ];
          const emitted = new Set<string>();
          for (const line of lines) {
            const actual = tokenizer.tokenize(line, true, tokenizer.getInitialState()).tokens;
            actual.forEach(token => emitted.add(token.type));
            if (line.startsWith('- ')) {
              const code = actual.find(token => token.type === 'variable.md');
              assert.ok(code, 'real inline code token exists');
              assert.equal(line.slice(code.offset, actual[actual.indexOf(code) + 1]?.offset), '`.memory/state/`');
              assert.notEqual(emittedColor(code.type), emittedColor(''), 'inline code differs from prose');
              assert.equal(emittedColor(code.type), '#ffff80');
            }
          }
          for (const category of ['keyword.md', 'variable.md', 'strong.md', 'emphasis.md', 'comment.md', 'string.link.md', 'meta.separator.md']) {
            assert.ok(emitted.has(category), `Markdown really emits ${category}`);
            assert.notEqual(emittedColor(category), emittedColor(''), `${category} differs from prose`);
          }
        }
        const categories = tokens.map((token: { type: string }) => token.type);
        if (id !== 'markdown') {
          const distinct = new Set(expected.map(emittedColor));
          assert.ok(distinct.size >= 3, `${id}: at least three actual syntax colors, got ${[...distinct]}`);
          for (const category of expected) assert.notEqual(emittedColor(category), emittedColor(''), `${id}: ${category} differs from body`);
        }
        for (const category of expected) {
          assert.ok(categories.includes(category), `${id}: missing ${category} in ${categories.join(', ')}`);
          const metadata = theme.match(1, category);
          const actual = theme.getColorMap()[TokenMetadata.getForeground(metadata)];
          assert.equal(actual.toString().toLowerCase(), `#${colorFor(category)}`, category);
        }
      } finally {
        tokenizer.dispose();
      }
    }
  } finally {
    hook.deregister();
  }
});
