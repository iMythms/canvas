import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatJson, JsonFormatError, minifyJson } from '../src/lib/jsonFormatter.ts'

test('formats nested JSON and leaves empty containers compact', () => {
  const source = '{"name":"Canvas","items":[1,{"empty":[],"object":{}}],"active":true}'
  assert.equal(formatJson(source), '{\n  "name": "Canvas",\n  "items": [\n    1,\n    {\n      "empty": [],\n      "object": {}\n    }\n  ],\n  "active": true\n}')
  assert.equal(minifyJson(formatJson(source)), source)
  for (const source of ['{}', '[]', '[{},[]]']) assert.equal(minifyJson(formatJson(source)), source)
})

test('supports four spaces and tab indentation at every nesting level', () => {
  assert.equal(formatJson('{"a":[1]}', 4), '{\n    "a": [\n        1\n    ]\n}')
  assert.equal(formatJson('{"a":[1]}', 'tabs'), '{\n\t"a": [\n\t\t1\n\t]\n}')
})

test('accepts every JSON scalar and removes only surrounding whitespace', () => {
  for (const scalar of ['true', 'false', 'null', '42', '-0', '"a b"', '1e400']) {
    assert.equal(formatJson(` \t\r\n${scalar}\n `), scalar)
    assert.equal(minifyJson(` \t\r\n${scalar}\n `), scalar)
  }
})

test('preserves escaped quotes, slashes, whitespace, punctuation, and unicode spelling inside strings', () => {
  const source = String.raw`{ "text" : "a \"quoted\" \\ path\n\t /,:[]{}", "unicode": "\u0061\/𝄞", "quote": "\\\"" }`
  const expected = String.raw`{"text":"a \"quoted\" \\ path\n\t /,:[]{}","unicode":"\u0061\/𝄞","quote":"\\\""}`
  assert.equal(minifyJson(source), expected)
  assert.equal(minifyJson(formatJson(source)), expected)
})

test('preserves number literals, duplicate keys, and numeric property order', () => {
  const source = '{ "2":9007199254740993, "1":-0, "2":1e400, "n":1.2300E+04, "tiny":-1e-999 }'
  const expected = '{"2":9007199254740993,"1":-0,"2":1e400,"n":1.2300E+04,"tiny":-1e-999}'
  assert.equal(minifyJson(source), expected)
  assert.equal(minifyJson(formatJson(source, 4)), expected)
})

test('rejects invalid JSON without repairing or returning partial output', () => {
  for (const source of ['', ' ', '{"a":}', '{"a":1,}', '[1,]', '{a:1}', "{'a':1}", '// comment\n{}', '/*comment*/{}', 'undefined', 'NaN', 'Infinity', '01', '+1', '[1 2]', '{}{}', '"unterminated', '"bad\\x20"', '"line\nbreak"', '\uFEFF{}', '[,]']) {
    assert.throws(() => formatJson(source), JsonFormatError, source)
    assert.throws(() => minifyJson(source), JsonFormatError, source)
  }
})

test('retains available syntax error locations, including end of input', () => {
  const position = new JsonFormatError('{\r\n "a": !}', new SyntaxError('Unexpected token at position 9'))
  assert.equal(position.line, 2)
  assert.equal(position.column, 7)
  const explicit = new JsonFormatError('', new SyntaxError('Unexpected token (line 3 column 4)'))
  assert.equal(explicit.line, 3)
  assert.equal(explicit.column, 4)
  const end = new JsonFormatError('{\n', new SyntaxError('Unexpected end of JSON input'))
  assert.equal(end.line, 2)
  assert.equal(end.column, 1)
  const unknown = new JsonFormatError('no', new SyntaxError('Invalid JSON'))
  assert.equal(unknown.line, undefined)
  assert.equal(unknown.column, undefined)
})

test('formatting is idempotent and handles deeply nested containers without recursive rewriting', () => {
  const source = '['.repeat(200) + '0' + ']'.repeat(200)
  const formatted = formatJson(source)
  assert.equal(formatJson(formatted), formatted)
  assert.equal(minifyJson(formatted), source)
})
