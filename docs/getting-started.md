# Getting Started

## Requirements

- Node.js 20+ (LTS recomendado)
- npm 10+ (ou compatível)

## Instalação (desenvolvimento)

```bash
npm install
npm run build
npm link
```

Alternativa:

```bash
npx ffvs --help
```

## Uso rápido

```bash
ffvs init
ffvs index .
ffvs inspect
ffvs inspect UserService
ffvs functions
ffvs classes
ffvs imports
ffvs children Controller
ffvs parents Database
ffvs relations Service --kind IMPORTS
```

Saída JSON:

```bash
ffvs functions --json
ffvs inspect UserService --json
ffvs path Controller Database --json
ffvs impact Database --json
```

### Fixture de demonstração

```bash
cd fixtures/layered
ffvs init
ffvs index .
ffvs path Controller Database
ffvs impact Database
```

Ou o clássico:

```bash
cd fixtures/basic-project
ffvs init
ffvs index .
ffvs inspect UserService
```

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

## Leitura

- [Software model](./software-model.md)
- [Architecture](./architecture.md)
- [Roadmap](./roadmap.md)
- [Contributing](../CONTRIBUTING.md)
