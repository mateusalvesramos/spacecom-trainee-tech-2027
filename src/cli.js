import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectEncounters } from './detectEncounters.js';
import { streamDataset } from './parser.js';

function printUsage() {
  console.error('Uso: node src/cli.js <entrada.txt> <saida.json>');
}

export function parseArguments(argumentsList) {
  if (argumentsList.length !== 2) {
    throw new Error('informe o caminho do arquivo de entrada e do arquivo de saída');
  }

  return {
    inputPath: argumentsList[0],
    outputPath: argumentsList[1],
  };
}

export async function processDataset(inputPath, outputPath) {
  const encounters = [];
  const recordsProcessed = await streamDataset(resolve(inputPath), async (records) => {
    encounters.push(...detectEncounters(records));
  });
  const resolvedOutputPath = resolve(outputPath);

  await mkdir(dirname(resolvedOutputPath), { recursive: true });
  await writeFile(resolvedOutputPath, `${JSON.stringify(encounters, null, 2)}\n`);

  return {
    recordsProcessed,
    encountersFound: encounters.length,
  };
}

export async function main(argumentsList) {
  try {
    const { inputPath, outputPath } = parseArguments(argumentsList);
    const result = await processDataset(inputPath, outputPath);
    console.log(
      `Processados ${result.recordsProcessed} posicionamentos; encontrados ${result.encountersFound} encontros.`,
    );
  } catch (error) {
    printUsage();
    console.error(`Erro: ${error.message}`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main(process.argv.slice(2));
}
