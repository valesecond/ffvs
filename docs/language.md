# Linguagem FFVS

A especificação e a implementação thin-slice estão em:

[`docs/language/`](./language/)

| Doc | Conteúdo |
| --- | -------- |
| [vision.md](./language/vision.md) | Por que uma linguagem |
| [principles.md](./language/principles.md) | Princípios |
| [semantics.md](./language/semantics.md) | Semântica |
| [uncertainty.md](./language/uncertainty.md) | Incerteza / resolution |
| [traverse.md](./language/traverse.md) | Direções e defaults de TRAVERSE |
| [path.md](./language/path.md) | PATH |
| [impact.md](./language/impact.md) | IMPACT (+ along calls) |
| [examples.md](./language/examples.md) | Exemplos executáveis |
| [grammar-draft.md](./language/grammar-draft.md) | EBNF |
| [open-questions.md](./language/open-questions.md) | Ambiguidades |
| [readiness.md](./language/readiness.md) | Status |

```bash
ffvs query 'select functions where name contains "x" describe'
ffvs query 'search "add" traverse callers resolution resolved describe'
```

Query Language **v0.3** (FFVS **0.8.0**): resolution-aware traverse + CALL impact.  
ADR-0022 · [`docs/roadmap/ffvs-0.9.md`](./roadmap/ffvs-0.9.md).
