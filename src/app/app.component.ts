import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `#.#####################
#.......#########...###
#######.#########.#.###
###.....#.>.>.###.#.###
###v#####.#v#.###.#.###
###.>...#.#.#.....#...#
###v###.#.#.#########.#
###...#.#.#.......#...#
#####.#.#.#######.#.###
#.....#.#.#.......#...#
#.#####.#.#.#########v#
#.#...#...#...###...>.#
#.#.#v#######v###.###v#
#...#.>.#...>.>.#.###.#
#####v#.#.###v#.#.###.#
#.....#...#...#.#.#...#
#.#########.###.#.#.###
#...###...#...#...#.###
###.###.#.###v#####v###
#...#...#.#.>.>.#.>.###
#.###.###.#.###.#.#v###
#.....###...###...#...#
#####################.#`;

  result = signal('');
  ngZone = inject(NgZone);

  onSubmit() {
    this.result.set(`...waiting`);

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const data = this.parseRow(this.input).map((item) => item.split(''));
        const total = this.start(data);
        this.result.set(`${total}`);
      }, 0);
    });
  }

  start(data: string[][]): number {
    const start = this.findAvailablePosition(data, 0);
    const end = this.findAvailablePosition(data, data.length - 1);
    return this.countMaxStepsOptimized(data, start, end);
  }

  countMaxStepsOptimized(
    map: string[][],
    start: { row: number; col: number },
    end: { row: number; col: number }
  ): number {
    const nodes = this.findNodes(map, start, end);
    const graph = this.buildGraph(map, nodes);
    const startKey = this.formatLoc(start);
    const endKey = this.formatLoc(end);

    // Try topological sort for DAG optimization
    const topoOrder = this.topologicalSort(graph);
    if (topoOrder) {
      return this.longestPathDAG(graph, startKey, endKey, topoOrder);
    }

    // Fallback to iterative DFS for cyclic graphs
    return this.longestPathIterative(graph, startKey, endKey);
  }

  topologicalSort(
    graph: Map<string, { to: string; dist: number }[]>
  ): string[] | null {
    const indegree = new Map<string, number>();
    for (const [node] of graph) {
      indegree.set(node, 0);
    }
    for (const [, edges] of graph) {
      for (const edge of edges) {
        indegree.set(edge.to, (indegree.get(edge.to) || 0) + 1);
      }
    }

    const queue: string[] = [];
    for (const [node, degree] of indegree) {
      if (degree === 0) queue.push(node);
    }

    const result: string[] = [];
    while (queue.length) {
      const node = queue.shift()!;
      result.push(node);
      const edges = graph.get(node) || [];
      for (const edge of edges) {
        indegree.set(edge.to, indegree.get(edge.to)! - 1);
        if (indegree.get(edge.to) === 0) {
          queue.push(edge.to);
        }
      }
    }

    return result.length === graph.size ? result : null;
  }

  longestPathDAG(
    graph: Map<string, { to: string; dist: number }[]>,
    start: string,
    end: string,
    topoOrder: string[]
  ): number {
    const maxDist = new Map<string, number>();
    for (const node of graph.keys()) {
      maxDist.set(node, -Infinity);
    }
    maxDist.set(start, 0);

    for (const node of topoOrder) {
      const dist = maxDist.get(node)!;
      if (dist !== -Infinity) {
        const edges = graph.get(node) || [];
        for (const edge of edges) {
          maxDist.set(edge.to, Math.max(maxDist.get(edge.to)!, dist + edge.dist));
        }
      }
    }

    return maxDist.get(end) ?? -Infinity;
  }

  longestPathIterative(
    graph: Map<string, { to: string; dist: number }[]>,
    start: string,
    end: string
  ): number {
    const maxDist = new Map<string, number>();
    const stack = [{ node: start, dist: 0, visited: new Set([start]) }];
    let result = 0;

    while (stack.length) {
      const curr = stack.pop()!;
      if (curr.node === end) {
        result = Math.max(result, curr.dist);
      } else {
        const edges = graph.get(curr.node) || [];
        for (const edge of edges) {
          if (!curr.visited.has(edge.to)) {
            const newVisited = new Set(curr.visited);
            newVisited.add(edge.to);
            stack.push({
              node: edge.to,
              dist: curr.dist + edge.dist,
              visited: newVisited,
            });
          }
        }
      }
    }

    return result;
  }

  findNodes(
    map: string[][],
    start: { row: number; col: number },
    end: { row: number; col: number }
  ): { row: number; col: number }[] {
    const nodes: { row: number; col: number }[] = [];
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[0].length; col++) {
        if (map[row][col] !== '#') {
          const neighbors = this.getNeighbors(map, { row, col });
          const isStartOrEnd =
            (row === start.row && col === start.col) ||
            (row === end.row && col === end.col);
          if (neighbors.length > 2 || isStartOrEnd) {
            nodes.push({ row, col });
          }
        }
      }
    }
    return nodes;
  }

  buildGraph(
    map: string[][],
    nodes: { row: number; col: number }[]
  ): Map<string, { to: string; dist: number }[]> {
    const graph = new Map<string, { to: string; dist: number }[]>();
    const nodeSet = new Set(nodes.map((n) => this.formatLoc(n)));

    for (const node of nodes) {
      const key = this.formatLoc(node);
      graph.set(key, []);
      const visited = new Set<string>();
      const queue: { pos: { row: number; col: number }; dist: number }[] = [
        { pos: node, dist: 0 },
      ];

      while (queue.length) {
        const curr = queue.shift()!;
        const currKey = this.formatLoc(curr.pos);
        if (visited.has(currKey)) continue;
        visited.add(currKey);

        if (currKey !== key && nodeSet.has(currKey)) {
          graph.get(key)!.push({ to: currKey, dist: curr.dist });
          continue;
        }

        const neighbors = this.getNeighbors(map, curr.pos);
        for (const neighbor of neighbors) {
          const nKey = this.formatLoc(neighbor);
          if (!visited.has(nKey)) {
            queue.push({ pos: neighbor, dist: curr.dist + 1 });
          }
        }
      }
    }
    return graph;
  }

  dfs(
    graph: Map<string, { to: string; dist: number }[]>,
    curr: string,
    end: string,
    memo: Map<string, number>
  ): number {
    if (curr === end) return 0;
    if (memo.has(curr)) return memo.get(curr)!;
    let max = -Infinity;
    const edges = graph.get(curr) || [];
    for (const edge of edges) {
      const res = this.dfs(graph, edge.to, end, memo);
      if (res !== -Infinity) {
        max = Math.max(max, res + edge.dist);
      }
    }
    memo.set(curr, max);
    return max;
  }

  getNeighbors(map: string[][], curr: { row: number; col: number }): any[] {
    return [
      // left
      { row: curr.row, col: curr.col - 1 },
      // right
      { row: curr.row, col: curr.col + 1 },
      // top
      { row: curr.row - 1, col: curr.col },
      // bottom
      { row: curr.row + 1, col: curr.col },
    ].filter((loc) => this.canMove(map, loc));
  }

  canMove(map: string[][], curr: { row: number; col: number }) {
    return this.validNode(map, curr) && map[curr.row][curr.col] !== '#';
  }

  getAllowedMoves(
    map: string[][],
    pos: { row: number; col: number }
  ): string[] {
    const cell = map[pos.row][pos.col];
    if (cell === '#') return [];
    return ['left', 'right', 'top', 'bottom'];
  }

  getNextPos(pos: { row: number; col: number }, dir: string): { row: number; col: number } {
    if (dir === 'left') return { row: pos.row, col: pos.col - 1 };
    if (dir === 'right') return { row: pos.row, col: pos.col + 1 };
    if (dir === 'top') return { row: pos.row - 1, col: pos.col };
    if (dir === 'bottom') return { row: pos.row + 1, col: pos.col };
    return pos;
  }

  findAvailablePosition(
    map: string[][],
    row: number
  ): { row: number; col: number } {
    for (let col = 0; col < map[0].length; col++) {
      if (map[row][col] !== '#') {
        return { row, col };
      }
    }
    return { row: -1, col: -1 };
  }

  validNode(map: any[][], node: { row: number; col: number }) {
    const width = map[0].length;
    const height = map.length;

    return (
      node.row >= 0 && node.row < height && node.col >= 0 && node.col < width
    );
  }

  formatLoc(currPos: { row: number; col: number }) {
    return [currPos.row, currPos.col]
      .filter((str) => str !== undefined)
      .join('-');
  }

  getDigit(str: string): number {
    return parseInt(str.replace(/^\D+/g, ''));
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
