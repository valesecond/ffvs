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
ffvs index . --exclude fixtures
ffvs inspect
ffvs functions --name create --path src
ffvs search UserService
ffvs callers createUser
ffvs calls total
ffvs children Controller
ffvs parents Database
ffvs relations Service --kind IMPORTS,CALLS
```

Saída JSON:

```bash
ffvs functions --name parse --json
ffvs search parse --kind function --json
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

Composição típica (sem DSL):

```bash
ffvs search resolve --kind function
ffvs callers <id-from-search>
```

Documentação da linguagem: [`language/`](./language/) (`ffvs query`).

Ainda faltam na DSL: `path`, `impact`, estágios `relations`.

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
