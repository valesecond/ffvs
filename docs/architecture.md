# Arquitetura do FFVS

## Objetivo deste documento

Definir a arquitetura inicial do MVP e os princípios que devem orientar evoluções futuras.
A estrutura de pastas proposta na visão original foi analisada criticamente; a versão abaixo é a adotada.

## Princípio de camadas

```text
CLI
 ↓
Application Layer   (casos de uso)
 ↓
Core Engine         (indexação, grafo, consulta — evolutivo)
 ↓
Domain Model        (entidades e relações)
 ↓
Adapters            (filesystem, parsers por linguagem, storage, git…)
```

A CLI **não** contém lógica de negócio. Ela traduz argumentos em chamadas à Application Layer e formata saída / códigos de saída.

Isso permite, no futuro, outras interfaces (API, extensão de editor, language server) reutilizarem o mesmo núcleo — sem implementá-las agora.

## Por que não um monorepo multi-package no dia 1?

**Alternativas consideradas:**

1. **Monorepo com packages** (`@ffvs/cli`, `@ffvs/core`, …) — isolamento forte, mas custo operacional alto para um MVP e um único mantenedor.
2. **Um único pacote com módulos por camada** — fronteiras claras via pastas e APIs públicas internas, menos fricção.
3. **Plugin runtime desde o início** — prematuro sem contratos estáveis.

**Decisão:** pacote único TypeScript com módulos internos por responsabilidade. Extrair packages quando houver evidência de necessidade (múltiplos consumidores ou ciclos de release distintos). Ver ADR-0005.

## Estrutura do repositório

```text
ffvs/
├── src/
│   ├── cli/                 # Interface de linha de comando
│   ├── application/         # Casos de uso: init, index, status
│   ├── core/
│   │   ├── domain/          # Project, File, Module, edges…
│   │   ├── indexer/         # Orquestra scan + extratores
│   │   ├── graph/           # Grafo em memória / serialização
│   │   ├── query/           # Reservado (Phase 2)
│   │   ├── analysis/        # Reservado (Phase 3)
│   │   └── transformation/  # Reservado (Phase 6)
│   ├── languages/
│   │   ├── types.ts         # Contrato LanguageAdapter
│   │   └── javascript/      # Adapter inicial (detecção; AST depois)
│   └── adapters/
│       ├── filesystem/      # Scan de diretórios
│       └── storage/         # Persistência em .ffvs/
├── tests/
├── docs/
│   └── design-decisions/
├── research/
├── examples/
├── .github/workflows/
├── package.json
├── tsconfig.json
└── README.md
```

### Comparação com a proposta original

A proposta original (`cli/`, `core/`, `languages/`, `git/`, `runtime/` na raiz) misturava pacotes de top-level com áreas ainda inexistentes (`git/`, `runtime/`).

Ajustes:

- Tudo executável sob `src/` para um único entrypoint e tooling simples.
- `git/` e `runtime/` **não** existem como pastas vazias; entram quando houver código e testes reais.
- `docs/`, `research/`, `examples/` e `tests/` permanecem na raiz (visão open source / acadêmica).

## Modelo de domínio (MVP)

Entidades iniciais:

| Entidade  | Descrição                                               |
| --------- | ------------------------------------------------------- |
| `Project` | Raiz FFVS (config + metadados)                          |
| `File`    | Arquivo indexado (path, linguagem, hash, tamanho)       |
| `Module`  | Unidade lógica (no JS: arquivo módulo); refinada depois |

Relações iniciais:

| Relação    | Significado                                                                   |
| ---------- | ----------------------------------------------------------------------------- |
| `CONTAINS` | Project → File; File → Module (quando aplicável)                              |
| `IMPORTS`  | Módulo → módulo/arquivo (quando o adapter conseguir extrair; opcional no MVP) |

Entidades futuras (não no MVP): Class, Function, Variable, Route, Test, Commit, Service, etc.

## Persistência local

Diretório `.ffvs/` na raiz do projeto alvo:

```text
.ffvs/
├── config.json      # Configuração do projeto FFVS
├── index.json       # Inventário de arquivos + estatísticas
└── graph.json       # Grafo serializado (nós e arestas)
```

JSON é suficiente para o MVP (inspecionável, diffável, sem dependência nativa).
Migração para SQLite ou outro store pode ocorrer se benchmarks justificarem (ADR futuro).

## Fluxos do MVP

### `ffvs init`

1. Verifica se já existe `.ffvs/`.
2. Cria estrutura e `config.json` com metadados mínimos.
3. Não indexa automaticamente (explícito: `ffvs index`).

### `ffvs index [path]`

1. Resolve projeto FFVS (sobe diretórios até achar `.ffvs/` ou usa cwd após init).
2. Escaneia o filesystem com exclusões padrão (`node_modules`, `.git`, `.ffvs`, …).
3. Detecta linguagem por extensão / heurística via adapters.
4. Constrói inventário + grafo inicial (arquivos; imports JS quando trivial).
5. Persiste `index.json` e `graph.json`.
6. Atualiza timestamp em `config.json`.

### `ffvs status`

1. Lê `.ffvs/`.
2. Reporta se inicializado, última indexação, contagens e avisos.

## Extensibilidade de linguagem

```text
LanguageAdapter
  - id / name
  - matches(file): boolean
  - extract?(source, path): ExtractionResult   // Phase 1+
```

O indexer depende da interface, não de JavaScript. O adapter JS é o primeiro; Python, Java, etc. entram como novos módulos sob `languages/`.

## Observabilidade e qualidade

- Códigos de saída: `0` sucesso, `1` erro de uso/estado, `2` falha interna.
- Mensagens de erro acionáveis na CLI.
- Logs estruturados apenas quando necessário (stderr); stdout preserva saída útil para piping futuro.
- Testes automatizados das camadas application e core.

## Limitações conscientes do MVP

- Sem DSL completa.
- Sem call graph robusto.
- Sem Git / runtime / transformações.
- Indexação full-scan (não incremental).
- Extração de imports JS best-effort e limitada.

Essas limitações são intencionais e documentadas no roadmap.
