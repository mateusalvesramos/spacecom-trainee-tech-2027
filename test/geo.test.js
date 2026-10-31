import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineDistance } from '../src/geo.js';

test('a distância entre um ponto e ele mesmo é zero', () => {
  const point = { latitude: 0, longitude: 0 };
  assert.equal(haversineDistance(point, point), 0);
});

test('a distância é simétrica', () => {
  const first = { latitude: -31.93195, longitude: -40.61438 };
  const second = { latitude: -31.93187, longitude: -40.61435 };

  assert.equal(haversineDistance(first, second), haversineDistance(second, first));
});

test('calcula o valor esperado para um par do dataset de referência', () => {
  const first = { latitude: -31.93195, longitude: -40.61438 };
  const second = { latitude: -31.93187, longitude: -40.61435 };

  assert.ok(Math.abs(haversineDistance(first, second) - 9.33522817789823) < 1e-12);
});

test('identifica uma distância menor que 20 metros', () => {
  const first = { latitude: 0, longitude: 0 };
  const second = { latitude: 0, longitude: 0.0001 };

  assert.ok(haversineDistance(first, second) < 20);
});

test('mantém a regra do desafio para uma distância acima de 20 metros', () => {
  const first = { latitude: 0, longitude: 0 };
  const second = { latitude: 0, longitude: 0.0002 };

  assert.ok(haversineDistance(first, second) > 20);
});
