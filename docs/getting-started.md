# Getting Started

## Requisitos

- Node.js 20+ (LTS recomendado)
- npm 10+ (ou compatível)

## Instalação (desenvolvimento)

Na raiz do repositório:

```bash
npm install
npm run build
npm link
```

Isso disponibiliza o comando `ffvs` no PATH local.

Alternativa sem link global:

```bash
npm install
npx ffvs --help
```

## Uso rápido

```bash
# Em um diretório de projeto de software
ffvs init
ffvs index .
ffvs status
```

### `ffvs init`

Cria o diretório `.ffvs/` com configuração inicial. Não indexa automaticamente.

### `ffvs index [path]`

Escaneia o diretório (padrão: `.`), detecta arquivos relevantes, constrói inventário e grafo inicial, e persiste em `.ffvs/`.

### `ffvs status`

Mostra se o projeto está inicializado, quando foi indexado e contagens básicas.

## Testes

```bash
npm test
```

## Qualidade

```bash
npm run lint
npm run typecheck
npm run format:check
```

## Próximos passos

Leia:

- [Arquitetura](./architecture.md)
- [Roadmap](./roadmap.md)
- [Filosofia](./philosophy.md)
- [Contributing](../CONTRIBUTING.md)
