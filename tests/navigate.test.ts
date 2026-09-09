import { describe, expect, it } from "vitest";

import { addEdge, addNode, createGraph } from "../src/core/domain/graph.js";
import { ancestors, children, descendants, findPath, parents } from "../src/core/graph/navigate.js";

function buildSample() {
  const graph = createGraph();
  for (const id of ["A", "B", "C", "D"]) {
    addNode(graph, {
      id,
      kind: "MODULE",
      name: id,
      location: null,
      properties: {},
    });
  }
  // A → B → C, A → C, D isolated
  addEdge(graph, "IMPORTS", "A", "B");
  addEdge(graph, "IMPORTS", "B", "C");
  addEdge(graph, "IMPORTS", "A", "C");
  addEdge(graph, "CONTAINS", "A", "B");
  return graph;
}

describe("graph navigation", () => {
  it("finds shortest directed path", () => {
    const graph = buildSample();
    const path = findPath(graph, "A", "C", { kinds: ["IMPORTS"] });
    expect(path.found).toBe(true);
    expect(path.nodeIds).toEqual(["A", "C"]);
    expect(path.hops).toHaveLength(1);
  });

  it("computes transitive dependents as ancestors on IMPORTS", () => {
    const graph = buildSample();
    const result = ancestors(graph, "C", { kinds: ["IMPORTS"] });
    expect(result.map((r) => r.node.id).sort()).toEqual(["A", "B"]);
  });

  it("computes transitive dependencies as descendants", () => {
    const graph = buildSample();
    const result = descendants(graph, "A", { kinds: ["IMPORTS"] });
    expect(result.map((r) => r.node.id).sort()).toEqual(["B", "C"]);
  });

  it("lists structural children and parents", () => {
    const graph = buildSample();
    expect(children(graph, "A").map((n) => n.id)).toEqual(["B"]);
    expect(parents(graph, "B").map((n) => n.id)).toEqual(["A"]);
  });

  it("returns not found when no path exists", () => {
    const graph = buildSample();
    expect(findPath(graph, "D", "A", { kinds: ["IMPORTS"] }).found).toBe(false);
  });
});
