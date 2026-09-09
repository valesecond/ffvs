/**
 * Query-facing CORE helpers (FILTER / SEARCH).
 * Future DSL planners should call these — not reimplement matching in a parser.
 */
export { matchesNode, selectFiles, selectNodes, type SelectPredicate } from "./select.js";
export { searchEntities, type SearchOptions } from "./search.js";
