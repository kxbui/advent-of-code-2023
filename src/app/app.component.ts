import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Karger-Stein algorithm.

type Graph = Map<string, Map<string, number>>;
type NodeSet = Set<string>;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `jqt: rhn xhk nvd
rsh: frs pzl lsr
xhk: hfx
cmg: qnr nvd lhk bvb
rhn: xhk bvb hfx
bvb: xhk hfx
pzl: lsr hfx nvd
qnr: nvd
ntq: jqt hfx bvb xhk
nvd: lhk
lsr: lhk
rzs: qnr cmg lsr rsh
frs: qnr lhk lsr`;

  result = signal('');
  ngZone = inject(NgZone);

  onSubmit() {
    this.result.set(`...waiting`);

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const data = this.parseRow(this.input);
        const graph = this.parseGraph(data);
        const total = this.start(graph);
        this.result.set(`${total}`);
      }, 0);
    });
  }

  start(multiGraph: Graph): number {
    // Execute Karger's Algorithm
    const component = this.kargersAlgorithm(multiGraph);

    // Calculate the product of the sizes of the two partitions
    // This assumes the algorithm found a cut that split the graph into two
    return component.size * (multiGraph.size - component.size);
  }

  /**
   * Karger's Algorithm implementation in TypeScript.
   * Note: This assumes the input graph keys are stringified sets 
   * to handle the Set-as-key requirement from the original Scala.
   */
  kargersAlgorithm(
    graph: Graph
  ): Set<string> {
    let minCut = Infinity;
    let bestPartition: Set<string> | null = null;
    // Run many iterations until we find a cut of 3
    for (let i = 0; i < 100000; i++) {
      const [partition, cutSize] = this.probabilisticMinCut(graph);
      if (cutSize < minCut) {
        minCut = cutSize;
        bestPartition = partition;
        if (minCut === 3) break;
      }
    }
    return bestPartition!;
  }

  /**
   * Karger's Probabilistic Min-Cut
   */
  probabilisticMinCut(
    data: Graph
  ): [NodeSet, number] {
    let graph = new Map(data); // Create a mutable copy of the graph for contraction
    
    while (graph.size > 2) {
      // Get a random starting node and pick a random edge from it
      const nodes = Array.from(graph.keys());
      const randomFromIdx = Math.floor(this.random() * nodes.length);
      const fromKey = nodes[randomFromIdx];
      const neighbors = graph.get(fromKey)!;

      if (neighbors.size === 0) {
        graph.delete(fromKey);
        continue;
      }

      // Pick a random neighbor weighted by edge count
      let randomValue = this.random() * Array.from(neighbors.values()).reduce((a, b) => a + b, 0);
      let toKey = "";
      for (const [neighbor, count] of neighbors) {
        randomValue -= count;
        if (randomValue <= 0) {
          toKey = neighbor;
          break;
        }
      }

      if (!toKey) continue;

      const from = new Set(fromKey.split(","));
      const to = new Set(toKey.split(","));
      graph = this.contractEdge(graph, [from, to]);
    }

    // Base case: When only two meta-nodes remain
    if (graph.size === 2) {
      const [[partition, edges]] = Array.from(graph.entries());
      const otherKey = Array.from(graph.keys()).find(k => k !== partition)!;
      const cutSize = edges.get(otherKey) || 0;
      // The key is a serialized string, so we turn it back into a Set
      return [new Set(partition.split(",")), cutSize];
    }

    return [new Set(), 0]; // Fallback, should not reach here
  }

  /**
 * Contracts an edge by merging two sets of nodes into one meta-node.
 */
  contractEdge(
    graph: Graph,
    edge: [NodeSet, NodeSet]
  ): Graph {
    const [from, to] = edge;
    const fromKey = this.serialize(from);
    const toKey = this.serialize(to);

    // 1. Get edges for both nodes, filtering out self-loops (the edge being contracted)
    const fromEdges = graph.get(fromKey)!;
    const toEdges = graph.get(toKey)!;

    // 2. Create the new merged meta-node (Set union)
    const connectedEdges = new Map<string, number>();
    for (const [neighbor, count] of fromEdges) {
      if (neighbor !== toKey) {
        connectedEdges.set(neighbor, (connectedEdges.get(neighbor) || 0) + count);
      }
    }
    for (const [neighbor, count] of toEdges) {
      if (neighbor !== fromKey) {
        connectedEdges.set(neighbor, (connectedEdges.get(neighbor) || 0) + count);
      }
    }
    const newEdgeSet = new Set([...from, ...to]);
    const newEdgeKey = this.serialize(newEdgeSet);

    // 3. Remove old nodes and add the new merged node
    const nextGraph = new Map(graph);
    nextGraph.delete(fromKey);
    nextGraph.delete(toKey);
    nextGraph.set(newEdgeKey, connectedEdges);

    // 4. Update all neighbor nodes: replace references to 'from' or 'to' with 'newEdge'
    for (const neighborKey of Array.from(connectedEdges.keys())) {
      const neighborsNeighbors = nextGraph.get(neighborKey)!;
      const updatedNeighbors = new Map<string, number>();
      for (const [n, c] of neighborsNeighbors) {
        if (n === fromKey || n === toKey) {
          updatedNeighbors.set(newEdgeKey, (updatedNeighbors.get(newEdgeKey) || 0) + c);
        } else {
          updatedNeighbors.set(n, c);
        }
      }
      nextGraph.set(neighborKey, updatedNeighbors);
    }

    return nextGraph;
  }

  serialize = (set: NodeSet): string =>
    Array.from(set).sort().join(",");

  random = () => Math.random();

  parseGraph(data: string[]): Map<string, Map<string, number>> {
    const graph = new Map<string, Map<string, number>>();
    data.forEach((element: string) => {
      const stringArray = element.trim().split(': ');
      const key = stringArray[0].trim();
      const values: string[] = stringArray[1].split(/\s+/).map((value: string) => value.trim());
      if (!graph.has(key)) graph.set(key, new Map<string, number>());
      values.forEach((v: string) => {
        if (!graph.has(v)) graph.set(v, new Map<string, number>());
        graph.get(key)!.set(v, (graph.get(key)!.get(v) || 0) + 1);
        graph.get(v)!.set(key, (graph.get(v)!.get(key) || 0) + 1);
      });
    })
    return graph;
  }

  getDigit(str: string): number {
    return parseInt(str.replace(/^-\D+/g, ''));
  }

  parseRow(data: any): any[] {
    return data.split(/\r?\n|\r|\n/g);
  }

  parseColumn(data: any): { arr1: any[]; arr2: any[] } {
    const arr1: any[] = [],
      arr2: any[] = [];
    const separateLines = data.split(/\r?\n|\r|\n/g);
    separateLines.forEach((element: any) => {
      const stringArray = element.trim().split(/\s*[\s,]\s*/);
      arr1.push(+stringArray[0]);
      arr2.push(+stringArray[1]);
    });
    return { arr1, arr2 };
  }
}
