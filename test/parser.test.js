import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseDataset, streamDataset } from '../src/parser.js';

const header =
  'idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida';

test('converte os campos válidos para os tipos esperados', () => {
  const records = parseDataset(
    `${header}\n1;;"2024-01-01 00:00:00";-10.1;-40.2;false;\n2;7;"2024-01-01 00:00:05";-10.2;-40.3;true;"1,3"\n`,
  );

  assert.equal(records.length, 2);
  assert.equal(records[0].id, 1);
  assert.equal(records[0].faction, '');
  assert.equal(records[0].protectiveMeasure, false);
  assert.deepEqual([...records[1].restrictionIds], [1, 3]);
});

test('ignora linhas vazias no final do arquivo', () => {
  assert.equal(parseDataset(`${header}\n1;;"2024-01-01 00:00:00";0;0;false;\n\n`).length, 1);
});

test('rejeita cabeçalho inválido', () => {
  assert.throws(() => parseDataset('cabecalho\n'), /cabeçalho inválido/);
});

test('rejeita campos, coordenadas, timestamp e booleano inválidos', () => {
  assert.throws(
    () => parseDataset(`${header}\n1;;"2024-01-01 00:00";0;0;false;`),
    /timestamp inválido/,
  );
  assert.throws(
    () => parseDataset(`${header}\n1;;"2024-01-01 00:00:00";91;0;false;`),
    /latitude inválida/,
  );
  assert.throws(
    () => parseDataset(`${header}\n1;;"2024-01-01 00:00:00";0;181;false;`),
    /longitude inválida/,
  );
  assert.throws(
    () => parseDataset(`${header}\n1;;"2024-01-01 00:00:00";0;0;maybe;`),
    /medidaProtetiva inválida/,
  );
});

test('ignora registros redundantes com o mesmo conteúdo', () => {
  const input = `${header}
1;;"2024-01-01 00:00:00";0;0;false;
1;;"2024-01-01 00:00:00";0;0;false;`;
  assert.equal(parseDataset(input).length, 1);
});

test('rejeita registros conflitantes no mesmo ID e timestamp', () => {
  const input = `${header}
1;;"2024-01-01 00:00:00";0;0;false;
1;;"2024-01-01 00:00:00";0;0.00001;false;`;
  assert.throws(() => parseDataset(input), /registros conflitantes/);
});

test('rejeita timestamps fora de ordem no streaming', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'spacecom-'));
  const inputPath = join(directory, 'input.txt');
  const input = `${header}
1;;"2024-01-01 00:00:05";0;0;false;
2;;"2024-01-01 00:00:00";0;0;false;`;

  await writeFile(inputPath, input);

  await assert.rejects(
    () => streamDataset(inputPath, async () => {}),
    /timestamp fora de ordem/,
  );
});

test('processa o último grupo no streaming', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'spacecom-'));
  const inputPath = join(directory, 'input.txt');
  const input = `${header}
1;;"2024-01-01 00:00:00";0;0;false;
2;;"2024-01-01 00:00:00";0;0.00005;false;`;
  const groups = [];

  await writeFile(inputPath, input);
  const recordsProcessed = await streamDataset(inputPath, async (records) => {
    groups.push(records);
  });

  assert.equal(recordsProcessed, 2);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].map(({ id }) => id), [1, 2]);
});
