# Filosofia do FFVS

## CLI-first

A CLI não é um wrapper de uma aplicação gráfica. É uma das interfaces conceituais centrais: scriptável, auditável e adequada a fluxos locais.

## Language-first

A linguagem de consulta/operação é parte do produto, não um atalho cosmético. Ela deve evoluir por experimentação de ergonomia, não por estética isolada.

## Composability

Operações devem poder ser combinadas. A inspiração Unix (`A | B | C`) aplica-se a **entidades semânticas**, não apenas a linhas de texto — ainda que a implementação inicial seja mais simples.

## Local-first

O funcionamento básico não deve depender de cloud ou serviços proprietários. Dados do índice residem no projeto (`.ffvs/`).

## Open source

Documentação, contribuição e segurança são parte da fundação, não um pós-escrito.

## Extensibilidade

O núcleo não deve acoplar-se a uma única linguagem de programação. Adapters isolam parsing e extração.

## Reprodutibilidade

Comandos e consultas relevantes devem poder ser repetidos com o mesmo input e produzir resultados comparáveis (dentro das limitações da análise estática).

## Observabilidade

O próprio FFVS deve ser testável, com erros claros e comportamento previsível. No futuro, o FFVS também poderá consumir sinais de observabilidade de sistemas-alvo.

## Pesquisa orientada a evidências

Não afirmar superioridade sem dados. Registrar hipóteses, experimentos e limitações. Não inventar resultados científicos.
