import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArguments } from '../src/cli.js';

test('aceita entrada e saída na CLI', () => {
  assert.deepEqual(parseArguments(['entrada.txt', 'saida.json']), {
    inputPath: 'entrada.txt',
    outputPath: 'saida.json',
  });
});

test('rejeita quantidade incorreta de argumentos', () => {
  assert.throws(() => parseArguments([]), /informe o caminho/);
});
