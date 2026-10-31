import { readFile } from 'node:fs/promises';

const EXPECTED_HEADER = [
  'idMonitorado',
  'faccaoMonitorado',
  'timestamp',
  'latitude',
  'longitude',
  'medidaProtetiva',
  'idsRestricaoMedida',
];

function splitLine(line) {
  const fields = [];
  let field = '';
  let quoted = false;

  for (const character of line) {
    if (character === '"') {
      quoted = !quoted;
    } else if (character === ';' && !quoted) {
      fields.push(field);
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) {
    throw new Error('aspas não fechadas');
  }

  fields.push(field);
  return fields;
}

function parseInteger(value, fieldName) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${fieldName} inválido: "${value}"`);
  }

  return Number(value);
}

function parseCoordinate(value, fieldName, minimum, maximum) {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) {
    throw new Error(`${fieldName} inválida: "${value}"`);
  }

  return coordinate;
}

function parseTimestamp(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`timestamp inválido: "${value}"`);
  }

  const [, year, month, day, hour, minute, second] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second
  ) {
    throw new Error(`timestamp inválido: "${value}"`);
  }

  return value;
}

function parseBoolean(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`medidaProtetiva inválida: "${value}"`);
}

function parseRestrictionIds(value) {
  if (value === '') return new Set();
  return new Set(value.split(',').map((id) => parseInteger(id, 'idsRestricaoMedida')));
}

function haveSameRestrictions(first, second) {
  if (first.size !== second.size) return false;
  return [...first].every((id) => second.has(id));
}

function areSameRecords(first, second) {
  return (
    first.id === second.id &&
    first.faction === second.faction &&
    first.timestamp === second.timestamp &&
    first.latitude === second.latitude &&
    first.longitude === second.longitude &&
    first.protectiveMeasure === second.protectiveMeasure &&
    haveSameRestrictions(first.restrictionIds, second.restrictionIds)
  );
}

function parseRecord(fields, lineNumber) {
  if (fields.length !== EXPECTED_HEADER.length) {
    throw new Error(
      `linha ${lineNumber}: esperados ${EXPECTED_HEADER.length} campos, recebidos ${fields.length}`,
    );
  }

  const [id, faction, timestamp, latitude, longitude, protectiveMeasure, restrictionIds] = fields;
  return {
    id: parseInteger(id, 'idMonitorado'),
    faction,
    timestamp: parseTimestamp(timestamp),
    latitude: parseCoordinate(latitude, 'latitude', -90, 90),
    longitude: parseCoordinate(longitude, 'longitude', -180, 180),
    protectiveMeasure: parseBoolean(protectiveMeasure),
    restrictionIds: parseRestrictionIds(restrictionIds),
  };
}

export function parseDataset(content) {
  const lines = content.split(/\r?\n/);
  const header = splitLine(lines.shift() ?? '');
  if (
    header.length !== EXPECTED_HEADER.length ||
    header.some((field, index) => field !== EXPECTED_HEADER[index])
  ) {
    throw new Error('cabeçalho inválido');
  }

  const records = [];
  const seenRecords = new Map();

  lines.forEach((line, index) => {
    if (line.trim() === '') return;

    const lineNumber = index + 2;
    const record = parseRecord(splitLine(line), lineNumber);
    const recordKey = `${record.timestamp}:${record.id}`;
    const previousRecord = seenRecords.get(recordKey);
    if (previousRecord && !areSameRecords(previousRecord, record)) {
      throw new Error(
        `linha ${lineNumber}: registros conflitantes para ID ${record.id} no timestamp ${record.timestamp}`,
      );
    }

    if (previousRecord) return;

    seenRecords.set(recordKey, record);
    records.push(record);
  });

  return records;
}

export async function readDataset(filePath) {
  return parseDataset(await readFile(filePath, 'utf8'));
}
