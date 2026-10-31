import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArguments, processDataset } from '../src/cli.js';

test('aceita entrada e saída na CLI', () => {
  assert.deepEqual(parseArguments(['entrada.txt', 'saida.json']), {
    inputPath: 'entrada.txt',
    outputPath: 'saida.json',
  });
});

test('rejeita quantidade incorreta de argumentos', () => {
  assert.throws(() => parseArguments([]), /informe o caminho/);
});

test('rejeita arquivo de entrada inexistente', async () => {
  await assert.rejects(
    () => processDataset('arquivo-inexistente.txt', 'saida.json'),
    /ENOENT/,
  );
});

test('processa o input e grava o JSON de saída', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'spacecom-'));
  const inputPath = join(directory, 'input.txt');
  const outputPath = join(directory, 'nested', 'output.json');
  const header =
    'idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida';
  const content = `${header}\n1;;"2024-01-01 00:00:00";0;0;false;\n2;;"2024-01-01 00:00:00";0;0.00005;false;\n`;

  await writeFile(inputPath, content);
  const result = await processDataset(inputPath, outputPath);
  const output = JSON.parse(await readFile(outputPath, 'utf8'));

  assert.deepEqual(result, { recordsProcessed: 2, encountersFound: 1 });
  assert.equal(output.length, 1);
  assert.equal(output[0].tipo, 'generico');
});
