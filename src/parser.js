import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';

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

function validateHeader(line) {
  const header = splitLine(line ?? '');
  if (
    header.length !== EXPECTED_HEADER.length ||
    header.some((field, index) => field !== EXPECTED_HEADER[index])
  ) {
    throw new Error('cabeçalho inválido');
  }
}

function registerRecord(recordsById, record, lineNumber) {
  const previousRecord = recordsById.get(record.id);
  if (previousRecord && !areSameRecords(previousRecord, record)) {
    throw new Error(
      `linha ${lineNumber}: registros conflitantes para ID ${record.id} no timestamp ${record.timestamp}`,
    );
  }

  if (!previousRecord) recordsById.set(record.id, record);
  return !previousRecord;
}

export function parseDataset(content) {
  const lines = content.split(/\r?\n/);
  validateHeader(lines.shift());

  const records = [];
  const seenRecords = new Map();

  lines.forEach((line, index) => {
    if (line.trim() === '') return;

    const lineNumber = index + 2;
    const record = parseRecord(splitLine(line), lineNumber);
    const recordKey = `${record.timestamp}:${record.id}`;
    const previousRecord = seenRecords.get(recordKey);
    if (previousRecord) {
      if (!areSameRecords(previousRecord, record)) {
        throw new Error(
          `linha ${lineNumber}: registros conflitantes para ID ${record.id} no timestamp ${record.timestamp}`,
        );
      }
      return;
    }

    seenRecords.set(recordKey, record);
    records.push(record);
  });

  return records;
}

export async function readDataset(filePath) {
  return parseDataset(await readFile(filePath, 'utf8'));
}

export async function streamDataset(filePath, onTimestampRecords) {
  const input = createReadStream(filePath, { encoding: 'utf8' });
  const lines = createInterface({ input, crlfDelay: Infinity });
  let lineNumber = 0;
  let currentTimestamp = null;
  let currentRecords = new Map();
  let recordsProcessed = 0;

  try {
    for await (const line of lines) {
      lineNumber += 1;
      if (lineNumber === 1) {
        validateHeader(line);
        continue;
      }
      if (line.trim() === '') continue;

      const record = parseRecord(splitLine(line), lineNumber);
      if (currentTimestamp !== null && record.timestamp < currentTimestamp) {
        throw new Error(`timestamp fora de ordem na linha ${lineNumber}`);
      }

      if (currentTimestamp !== record.timestamp) {
        if (currentTimestamp !== null) {
          await onTimestampRecords([...currentRecords.values()]);
        }
        currentTimestamp = record.timestamp;
        currentRecords = new Map();
      }

      if (registerRecord(currentRecords, record, lineNumber)) {
        recordsProcessed += 1;
      }
    }

    if (currentTimestamp !== null) {
      await onTimestampRecords([...currentRecords.values()]);
    }
  } finally {
    lines.close();
    input.destroy();
  }

  return recordsProcessed;
}
