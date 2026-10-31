import { classifyEncounter } from './classifyEncounter.js';
import { ENCOUNTER_DISTANCE_METERS, haversineDistance } from './geo.js';

function compareRecords(first, second) {
  return first.id - second.id;
}

function createEncounter(first, second, timestamp, distance) {
  const tipo = classifyEncounter(first, second);
  if (tipo === null) return null;

  return {
    tipo,
    monitoradosEncontro: [first.id, second.id],
    timestamp,
    posicoes: {
      [first.id]: { lat: first.latitude, lon: first.longitude },
      [second.id]: { lat: second.latitude, lon: second.longitude },
    },
    distanciaMetros: distance,
  };
}

export function detectEncounters(records) {
  const recordsByTimestamp = new Map();

  for (const record of records) {
    const timestampRecords = recordsByTimestamp.get(record.timestamp) ?? [];
    timestampRecords.push(record);
    recordsByTimestamp.set(record.timestamp, timestampRecords);
  }

  const encounters = [];
  const timestampEntries = [...recordsByTimestamp.entries()].sort(([first], [second]) =>
    first.localeCompare(second),
  );

  for (const [timestamp, timestampRecords] of timestampEntries) {
    timestampRecords.sort(compareRecords);

    for (let firstIndex = 0; firstIndex < timestampRecords.length; firstIndex += 1) {
      for (
        let secondIndex = firstIndex + 1;
        secondIndex < timestampRecords.length;
        secondIndex += 1
      ) {
        const first = timestampRecords[firstIndex];
        const second = timestampRecords[secondIndex];
        const distance = haversineDistance(first, second);

        if (distance < ENCOUNTER_DISTANCE_METERS) {
          const encounter = createEncounter(first, second, timestamp, distance);
          if (encounter !== null) encounters.push(encounter);
        }
      }
    }
  }

  return encounters;
}
