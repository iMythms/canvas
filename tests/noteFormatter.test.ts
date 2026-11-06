import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatNote, isCurrentFormat } from '../src/lib/noteFormatter.ts'
import { detectLanguage } from '../src/lib/noteMode.ts'

test('formats seven languages and is idempotent', async () => {
  for (const [language, input] of Object.entries({ javascript: 'const x={a:1}', typescript: 'const x:number=1', json: '{"x":1}', html: '<div><p>hello</p></div>', css: 'a{color:red}', markdown: '# Hello\n\n- a\n- b', yaml: 'a: 1\nb: [1,2]' })) {
    const first = await formatNote(input, language)
    assert.ok(first.kind === 'formatted' || first.kind === 'unchanged', `${language}: ${JSON.stringify(first)}`)
    const second = await formatNote(first.text, language)
    assert.equal(second.kind, 'unchanged', language)
  }
})
test('preserves JSON tokens and line endings; invalid and unsupported do not produce edits', async () => {
  const result = await formatNote('{"x":1e+20,"x":9007199254740993}', 'json')
  assert.ok(result.kind === 'formatted'); assert.match(result.text, /1e\+20/); assert.match(result.text, /9007199254740993/); assert.equal((result.text.match(/"x"/g) ?? []).length, 2)
  const crlf = await formatNote('const x=1;\r\nconst y=2;', 'javascript')
  assert.ok(crlf.kind === 'formatted'); assert.doesNotMatch(crlf.text, /(?<!\r)\n/)
  assert.equal((await formatNote('const = ;', 'javascript')).kind, 'error')
  assert.equal((await formatNote('print(1)', 'python')).kind, 'unsupported')
  assert.equal((await formatNote('const x=1', 'python')).kind, 'unsupported')
})
test('auto detects fences, large JSON, Rust and YAML conservatively', async () => {
  assert.equal(detectLanguage('# Notes\n```js\nconst x = 1\n```'), 'markdown')
  assert.equal(detectLanguage('# helper\ndef run():\n  pass'), 'python')
  assert.equal(detectLanguage('fn main() { let x = 1; }'), 'rust')
  assert.equal(detectLanguage('{"x":"' + 'a'.repeat(25000) + '"}'), 'json')
  assert.equal(detectLanguage('name: Canvas\nversion: 1'), 'yaml')
  assert.equal(detectLanguage('A note about things'), 'plaintext')
  assert.equal((await formatNote('const x=1', 'auto')).kind, 'formatted')
})
test('stale snapshots reject changes to model, version or choice', () => {
  const model = {}; const snapshot = { model, version: 1, choice: 'auto' }
  assert.equal(isCurrentFormat(snapshot, { ...snapshot }), true)
  assert.equal(isCurrentFormat(snapshot, { ...snapshot, version: 2 }), false)
  assert.equal(isCurrentFormat(snapshot, { ...snapshot, model: {} }), false)
  assert.equal(isCurrentFormat(snapshot, { ...snapshot, choice: 'json' }), false)
})

test('selection endpoints stay on the same code when punctuation is added', async () => {
  for (const newline of ['\n', '\r\n']) {
    const source = ['const first={x:1}', 'const second={y:2}', 'second.y'].join(newline)
    const start = source.lastIndexOf('second.y')
    const result = await formatNote(source, 'javascript', [start, start + 8])
    assert.equal(result.kind, 'formatted')
    if (result.kind !== 'formatted') return
    assert.equal(result.text.slice(result.offsets[0], result.offsets[1]), 'second.y')
  }
})

test('JSON cursor mapping preserves every position inside string literals', async () => {
  const values = [' hello world  ', 'a "quoted" \\ value', 'a\tb', 'unicode\u2003space']
  const source = JSON.stringify({ values })
  const positions = values.flatMap(value => {
    const literal = JSON.stringify(value)
    const start = source.indexOf(literal)
    return Array.from({ length: literal.length }, (_, index) => ({ offset: start + index, literal, index }))
  })
  const result = await formatNote(source, 'json', positions.map(position => position.offset))
  assert.equal(result.kind, 'formatted')
  if (result.kind !== 'formatted') return
  positions.forEach(({ literal, index }, entry) => assert.equal(result.offsets[entry], result.text.indexOf(literal) + index))
})
