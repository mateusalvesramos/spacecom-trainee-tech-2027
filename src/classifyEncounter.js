function isAggressor(record) {
  return !record.protectiveMeasure;
}

export function classifyEncounter(first, second) {
  const isProtectiveEncounter =
    (first.protectiveMeasure &&
      isAggressor(second) &&
      first.restrictionIds.has(second.id)) ||
    (second.protectiveMeasure &&
      isAggressor(first) &&
      second.restrictionIds.has(first.id));

  if (isProtectiveEncounter) return 'protetiva';

  if (
    isAggressor(first) &&
    isAggressor(second) &&
    first.faction !== '' &&
    first.faction === second.faction
  ) {
    return 'faccao';
  }

  if (isAggressor(first) && isAggressor(second)) return 'generico';

  return null;
}
