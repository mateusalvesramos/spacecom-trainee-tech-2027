# spacecom-trainee-tech-2027

Solução em JavaScript/Node.js para o desafio de detecção de encontros da
Spacecom.

## Requisitos

- Node.js 18 ou superior.

## Instalação e testes

```powershell
npm test
```

Os testes cobrem parsing, validação de entrada, Haversine, limite de distância,
classificação, unicidade e integração da CLI.

## Execução

```powershell
npm start -- datasets\dataset1.txt outputs\dataset1.json
```

O primeiro caminho é o arquivo de entrada e o segundo é o arquivo JSON de
saída. A pasta de destino é criada automaticamente quando necessário.

O processamento é feito em streaming por timestamp: o programa não carrega
todo o dataset na memória. Os datasets oficiais estão ordenados por timestamp,
permitindo liberar cada grupo depois de processá-lo.

## Lógica da solução

1. O parser valida o cabeçalho, os tipos dos campos, coordenadas, timestamps e
   duplicidades.
2. O arquivo é lido linha a linha e os registros do mesmo timestamp são
   agrupados.
3. Para cada timestamp, cada par é avaliado uma única vez.
4. A distância é calculada com Haversine usando raio terrestre de
   `6.371.000` metros.
5. O encontro só é aceito quando a distância é estritamente menor que `20`
   metros.
6. `medidaProtetiva: true` identifica uma vítima; `false` identifica um
   monitorado/agressor.
7. Encontros genéricos e de facção ocorrem somente entre dois agressores.
   Encontros de facção exigem a mesma facção preenchida.
8. Encontros protetivos exigem um agressor e uma vítima que o tenha listado em
   `idsRestricaoMedida`.
9. A classificação segue a prioridade `protetiva`, `faccao`, `generico`.

Duplicatas completamente idênticas no mesmo ID e timestamp são tratadas como
redundância. Se qualquer campo divergir, o processamento falha para evitar
resultados baseados em dados inconsistentes.

## Arquitetura

- `src/parser.js`: parsing, validação e leitura em streaming.
- `src/geo.js`: fórmula de Haversine.
- `src/classifyEncounter.js`: regras de classificação.
- `src/detectEncounters.js`: agrupamento, pares e formato dos encontros.
- `src/cli.js`: execução e gravação do JSON.
- `test/`: testes automatizados.

## Decisões de desempenho

A primeira abordagem carregava o arquivo inteiro e excedia o limite de heap nos
datasets maiores. Como os datasets oficiais estão ordenados por timestamp, a
solução atual processa um timestamp por vez, descarta o grupo anterior e
mantém o uso de memória proporcional ao maior grupo, não ao tamanho total do
arquivo.

Essa abordagem permitiu concluir o processamento dos datasets 6 e 7 sem erro
de memória, mantendo a lógica de detecção inalterada.

## Resultados de validação

Os datasets 1 e 2 foram comparados com as respostas de referência. Os outputs
dos datasets 1 a 7 passaram por validação estrutural independente, incluindo
distância, tipo, posições, timestamp e duplicidade.

| Dataset | Registros | Encontros |
|---|---:|---:|
| 1 | 5.000 | 4 |
| 2 | 25.000 | 6 |
| 3 | 100.000 | 10 |
| 4 | 400.020 | 15 |
| 5 | 1.000.000 | 21 |
| 6 | 8.000.000 | 27 |
| 7 | 12.000.000 | 35 |

## Datasets

Os datasets são arquivos grandes e não fazem parte do versionamento do projeto.
Baixe-os localmente na pasta `datasets` quando necessário:

```powershell
New-Item -ItemType Directory -Force datasets

1..7 | ForEach-Object {
  Invoke-WebRequest `
    -Uri "https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset$_.txt" `
    -OutFile "datasets\dataset$_.txt"
}
```

Links para download individual:

- [dataset1.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset1.txt)
- [dataset2.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset2.txt)
- [dataset3.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset3.txt)
- [dataset4.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset4.txt)
- [dataset5.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset5.txt)
- [dataset6.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset6.txt)
- [dataset7.txt](https://bucket-projeto-trainee.s3.sa-east-1.amazonaws.com/dataset7.txt)

## Estrutura

- `src/`: código da solução.
- `test/`: testes automatizados.
- `datasets/`: arquivos de entrada locais, ignorados pelo Git.
- `outputs/`: respostas de referência pequenas.
