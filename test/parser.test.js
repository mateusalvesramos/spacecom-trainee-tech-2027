import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDataset } from '../src/parser.js';

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
