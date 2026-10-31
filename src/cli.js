import { fileURLToPath } from 'node:url';

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

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    parseArguments(process.argv.slice(2));
  } catch (error) {
    printUsage();
    console.error(`Erro: ${error.message}`);
    process.exitCode = 2;
  }
}
