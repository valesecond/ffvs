# Linguagem FFVS

Especificação do produto: [`docs/language/`](./language/)

| Doc                                                                                                       | Conteúdo                    |
| --------------------------------------------------------------------------------------------------------- | --------------------------- |
| [overview.md](./language/overview.md)                                                                     | Visão da Query Language 1.0 |
| [syntax.md](./language/syntax.md)                                                                         | Sintaxe                     |
| [semantics.md](./language/semantics.md)                                                                   | ResultSet, ordem, vazio     |
| [errors.md](./language/errors.md)                                                                         | Erros                       |
| [resolution.md](./language/resolution.md)                                                                 | Incerteza                   |
| [examples.md](./language/examples.md)                                                                     | Exemplos                    |
| [traverse.md](./language/traverse.md) / [path.md](./language/path.md) / [impact.md](./language/impact.md) | Detalhes                    |

```bash
ffvs query 'select functions where name contains "x" describe'
ffvs query 'search "loadUser" traverse callers resolution resolved describe'
```

**FFVS 1.0.0** · Query Language **1.0** · [ADR-0024](./design-decisions/ADR-0024-ffvs-1-0.md)
