# MVP — Definição

## Objetivo do MVP

Estabelecer uma fundação **arquiteturalmente correta** e utilizável:

1. CLI real com help;
2. Inicialização local de projeto FFVS;
3. Indexação de diretório com detecção de arquivos;
4. Representação inicial persistida (inventário + grafo mínimo);
5. Status legível;
6. Testes e documentação suficientes para o próximo ciclo.

## Dentro do escopo

| Item           | Critério de pronto                                                |
| -------------- | ----------------------------------------------------------------- |
| `ffvs --help`  | Lista comandos e opções                                           |
| `ffvs init`    | Cria `.ffvs/config.json`; idempotente ou erro claro se já existir |
| `ffvs index .` | Scan + persistência `index.json` / `graph.json`                   |
| `ffvs status`  | Reporta estado a partir de `.ffvs/`                               |
| Camadas        | CLI → application → core/domain → adapters                        |
| Adapter JS     | Detecção por extensão; extração profunda opcional/limitada        |
| Testes         | Cobrem init, index, status e erros principais                     |
| Docs           | README, arquitetura, ADRs, research, contributing                 |

## Fora do escopo (agora)

- DSL / `find` / `query` / `trace` / `impact`
- AST completa e call graphs
- Git, runtime, transformações
- UI, API HTTP, extensão VS Code
- Multi-linguagem além da detecção básica
- Indexação incremental

## Critérios de qualidade do MVP

- Nenhum comando placeholder;
- Mensagens de erro claras;
- Códigos de saída consistentes;
- Sem dependências injustificadas;
- Pronto para Phase 1 (parser JS/AST) sem reescrever as camadas.
