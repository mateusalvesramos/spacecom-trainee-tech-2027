import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDataset } from '../src/parser.js';
import { detectEncounters } from '../src/detectEncounters.js';

const header =
  'idMonitorado;faccaoMonitorado;timestamp;latitude;longitude;medidaProtetiva;idsRestricaoMedida';

test('detecta encontro genérico apenas no mesmo timestamp', () => {
  const input = `${header}
1;;"2024-01-01 00:00:00";0;0;false;
2;;"2024-01-01 00:00:00";0;0.00005;false;
2;;"2024-01-01 00:00:05";0;0.00005;false;`;

  const encounters = detectEncounters(parseDataset(input));

  assert.equal(encounters.length, 1);
  assert.equal(encounters[0].tipo, 'generico');
  assert.deepEqual(encounters[0].monitoradosEncontro, [1, 2]);
});

test('classifica encontro de facção quando as facções são iguais e preenchidas', () => {
  const input = `${header}
1;7;"2024-01-01 00:00:00";0;0;false;
2;7;"2024-01-01 00:00:00";0;0.00005;false;`;

  const [encounter] = detectEncounters(parseDataset(input));

  assert.equal(encounter.tipo, 'faccao');
});

test('classifica encontro protetivo pela lista de restrições da vítima', () => {
  const input = `${header}
1;;"2024-01-01 00:00:00";0;0;false;
2;;"2024-01-01 00:00:00";0;0.00005;true;"1"`;

  const [encounter] = detectEncounters(parseDataset(input));

  assert.equal(encounter.tipo, 'protetiva');
});

test('prioriza encontro protetivo sobre encontro de facção', () => {
  const input = `${header}
1;7;"2024-01-01 00:00:00";0;0;false;
2;7;"2024-01-01 00:00:00";0;0.00005;true;"1"`;

  const [encounter] = detectEncounters(parseDataset(input));

  assert.equal(encounter.tipo, 'protetiva');
});

test('não registra pares a 20 metros ou mais', () => {
  const input = `${header}
1;;"2024-01-01 00:00:00";0;0;false;
2;;"2024-01-01 00:00:00";0;0.0002;false;`;

  assert.equal(detectEncounters(parseDataset(input)).length, 0);
});

test('registra cada par uma única vez e mantém posições e distância', () => {
  const input = `${header}
2;;"2024-01-01 00:00:00";0;0.00005;false;
1;;"2024-01-01 00:00:00";0;0;false;`;

  const [encounter] = detectEncounters(parseDataset(input));

  assert.deepEqual(encounter.monitoradosEncontro, [1, 2]);
  assert.deepEqual(encounter.posicoes, {
    1: { lat: 0, lon: 0 },
    2: { lat: 0, lon: 0.00005 },
  });
  assert.ok(encounter.distanciaMetros > 0);
});
