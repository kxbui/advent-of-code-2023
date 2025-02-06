import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * A* algorthm with
 * priority queue for open list
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `2413432311323
3215453535623
3255245654254
3446585845452
4546657867536
1438598798454
4457876987766
3637877979653
4654967986887
4564679986453
1224686865563
2546548887735
4322674655533`;

  result = signal('');
  ngZone = inject(NgZone);

  onSubmit() {
    this.result.set(`...waiting`);

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const data = this.parseRow(this.input).map((line) => line.split(''));
        const total = this.start(data);
        this.result.set(`${total}`);
      }, 0);
    });
  }

  start(data: string[][]): number {
    return this.search(
      data,
      { row: 0, col: 0 },
      { row: data.length - 1, col: data[0].length - 1 }
    );
  }

  search(
    map: any[][],
    start: { row: number; col: number },
    end: { row: number; col: number }
  ): number {
    const comparator: Comparator<any> = (itemA, itemB) => {
      return itemB.f - itemA.f;
    };
    const keyGetter = (item: any) => this.formatLoc(item.location);

    const open = new PriorityQueue(comparator, keyGetter);
    open.add({ location: start, f: 0, g: 0 });

    const close = new Set<string>();

    if (start && end) {
      while (open.size) {
        const q = open.poll();

        if (q) {
          if (this.isGoal(q.location, end)) {
            return q.g;
          }

          // check all neighbors
          let neighbors = this.findNeighbors(map, q.location);
          if (neighbors.length) {
            const nodes = neighbors
              .map((neighbor) => {
                // successor.g = q.g + distance between successor and q
                const g = q.g + neighbor.g;
                // successor.h = distance from goal to successor
                const h = this.calcDistance(neighbor, end);
                // successor.f = successor.g + successor.h
                const f = g + h;

                return { location: neighbor, f, parent: q, g };
              })
              .filter((neighbor) => {
                // if a node with the same position as
                // successor is in the CLOSE list which has a
                // lower f than successor, skip this successor
                if (close.has(this.formatLoc(q.location))) {
                  return false;
                }

                // if a node with the same position as
                // successor is in the OPEN list which has a
                // lower f than successor, skip this successor
                const itemInOpen = open.find(neighbor);

                if (!itemInOpen) {
                  return true;
                }

                // otherwise, add the node to the open list
                return true;
              });
            open.add(...nodes);
          }
        }
        // Move current node from open to closed list
        close.add(this.formatLoc(q.location));
      }
    }
    return 0;
  }

  reconstructPath(node: any): Set<string> {
    const path = new Set<string>();
    let curr = node;

    while (curr) {
      const { direction, ...remaining } = curr.location;
      path.add(this.formatLoc(remaining));
      console.log(`${this.formatLoc(remaining)} ${curr.g}`);
      curr = curr.parent;
    }
    return path;
  }

  isGoal(
    curr: { row: number; col: number },
    goal: { row: number; col: number }
  ): boolean {
    return curr.row === goal.row && curr.col === goal.col;
  }

  calcDistance(
    curr: { row: number; col: number },
    goal: { row: number; col: number }
  ) {
    return Math.abs(curr.row - goal.row) + Math.abs(curr.col - goal.col);
  }

  findNeighbors(
    map: string[][],
    curr: { row: number; col: number; direction: string }
  ): any[] {
    if (curr.direction === 'H') return this.getVertNeighbors(map, curr);
    else if (curr.direction === 'V') return this.getHorizNeighbors(map, curr);
    return [
      ...this.getVertNeighbors(map, curr),
      ...this.getHorizNeighbors(map, curr),
    ];
  }

  getHorizNeighbors(
    map: string[][],
    curr: { row: number; col: number }
  ): any[] {
    const arr: any[] = [];
    let g = 0;

    for (let i = 1; i <= 3; i++) {
      const node = { row: curr.row, col: curr.col + i };
      if (this.validNode(map, node)) {
        g += Number(map[node.row][node.col]);
        arr.push({ ...node, g, direction: 'H' });
      } else {
        break;
      }
    }

    g = 0;

    for (let i = 1; i <= 3; i++) {
      const node = { row: curr.row, col: curr.col - i };
      if (this.validNode(map, node)) {
        g += Number(map[node.row][node.col]);
        arr.push({ ...node, g, direction: 'H' });
      } else {
        break;
      }
    }

    return arr;
  }

  getVertNeighbors(map: string[][], curr: { row: number; col: number }): any[] {
    const arr: any[] = [];
    let g = 0;

    for (let i = 1; i <= 3; i++) {
      const node = { row: curr.row + i, col: curr.col };
      if (this.validNode(map, node)) {
        g += Number(map[node.row][node.col]);
        arr.push({ ...node, g, direction: 'V' });
      } else {
        break;
      }
    }

    g = 0;

    for (let i = 1; i <= 3; i++) {
      const node = { row: curr.row - i, col: curr.col };
      if (this.validNode(map, node)) {
        g += Number(map[node.row][node.col]);
        arr.push({ ...node, g, direction: 'V' });
      } else {
        break;
      }
    }

    return arr;
  }

  validNode(map: string[][], curr: { row: number; col: number }): boolean {
    return (
      curr.row >= 0 &&
      curr.row < map.length &&
      curr.col >= 0 &&
      curr.col < map[0].length
    );
  }

  formatLoc(currPos: { row: number; col: number; direction: string }) {
    return [currPos.row, currPos.col, currPos.direction]
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

type Comparator<T> = (valueA: T, valueB: T) => number;

const swap = (arr: unknown[], i: number, j: number) => {
  [arr[i], arr[j]] = [arr[j], arr[i]];
};

class PriorityQueue<T> {
  #heap;
  #isGreater;
  #keyGetter;
  #set;

  constructor(comparator: Comparator<T>, keyGetter: (item: T) => string);
  constructor(
    comparator: Comparator<T>,
    keyGetter: (item: T) => string,
    init: T[] = []
  ) {
    this.#heap = init;
    this.#isGreater = (a: number, b: number) =>
      comparator(init[a] as T, init[b] as T) > 0;
    this.#keyGetter = keyGetter;
    this.#set = new Set<string>();
  }

  get size(): number {
    return this.#heap.length;
  }

  peek(): T | undefined {
    return this.#heap[0];
  }

  add(...arr: T[]): void {
    if (arr && arr.length) {
      arr.forEach((val) => {
        this.#heap.push(val);
        this.#siftUp();
        this.#set.add(this.#keyGetter(val));
      });
    }
  }

  find(item: T): boolean {
    return this.#set.has(this.#keyGetter(item));
  }

  poll(): T | undefined;
  poll(
    heap = this.#heap,
    value = heap[0],
    length = heap.length
  ): T | undefined {
    if (length) {
      swap(heap, 0, length - 1);
    }

    const item = heap.pop();
    this.#siftDown();

    this.#set.delete(this.#keyGetter(item!));

    return value;
  }

  print() {
    console.log(this.#heap.slice());
  }

  #siftUp(): void;
  #siftUp(node = this.size - 1, parent = ((node + 1) >>> 1) - 1): void {
    for (
      ;
      node && this.#isGreater(node, parent);
      node = parent, parent = ((node + 1) >>> 1) - 1
    ) {
      swap(this.#heap, node, parent);
    }
  }

  #siftDown(): void;
  #siftDown(size = this.size, node = 0, isGreater = this.#isGreater): void {
    while (true) {
      const leftNode = (node << 1) + 1;
      const rightNode = leftNode + 1;

      if (
        (leftNode >= size || isGreater(node, leftNode)) &&
        (rightNode >= size || isGreater(node, rightNode))
      ) {
        break;
      }

      const maxChild =
        rightNode < size && isGreater(rightNode, leftNode)
          ? rightNode
          : leftNode;

      swap(this.#heap, node, maxChild);

      node = maxChild;
    }
  }
}
