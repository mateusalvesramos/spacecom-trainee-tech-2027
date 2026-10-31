# spacecom-trainee-tech-2027

Solução em JavaScript/Node.js para o desafio de detecção de encontros da
Spacecom.

## Requisitos

- Node.js 18 ou superior.

## Instalação e testes

```powershell
npm test
```

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
