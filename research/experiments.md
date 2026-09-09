# Experiments

Registro de experimentos. Entradas devem ser adicionadas **somente** quando um experimento for planejado ou executado.

## Modelo de entrada

```text
### EXP-XXXX — Título
- Date:
- Status: planned | running | completed | abandoned
- Hypothesis:
- Method:
- Dataset:
- Metrics:
- Results: (somente após execução)
- Limitations:
- Artifacts:
```

## Experimentos

Nenhum experimento concluído nesta fundação (Phase 0).

### EXP-0001 — Baseline de indexação local (planejado)

- Date: TBD
- Status: planned
- Hypothesis: H1 (parcial) — inventário + grafo de arquivos é construível com custo aceitável em repositórios pequenos/médios
- Method: Medir tempo e tamanho de artefatos `.ffvs/` em fixtures e 1–2 repositórios open source
- Dataset: fixtures do repositório + amostras a definir
- Metrics: tempo de `ffvs index`, bytes de `index.json`/`graph.json`, contagem de nós/arestas
- Results: —
- Limitations: não mede qualidade semântica além de inventário
- Artifacts: —
