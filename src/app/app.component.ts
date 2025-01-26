import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Use BFS
 * Use Point-In-Polygon algorithm
 * to determine a point is inside or
 * outside the loop
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `...........
.S-------7.
.|F-----7|.
.||.....||.
.||.....||.
.|L-7.F-J|.
.|..|.|..|.
.L--J.L--J.
...........`;

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
    return this.countEnclosedTiles(
      data,
      this.search(data, this.findLoc(data, 'S')!)
    );
  }

  search(map: any[][], start: { row: number; col: number }): Set<string> {
    const visited = new Map<string, any>();
    const queue: any[] = [];

    visited.set(this.formatLoc(start), start);
    this.findStartingPaths(map, start).forEach((loc) => queue.push(loc));

    while (queue.length) {
      const s = queue.shift();
      if (s) {
        if (visited.has(this.formatLoc(s))) {
          const remainingPath = visited.get(this.formatLoc(s));
          return new Set([
            this.formatLoc(start),
            ...this.reconstructPath(s).reverse(),
            ...this.reconstructPath(remainingPath),
          ]);
        }
        const paths = this.findPaths(map, s);
        paths
          .filter((path) => !visited.has(this.formatLoc(path)))
          .forEach((path) => {
            const node = { ...path, parent: s };
            queue.push(node);
          });
      }
      visited.set(this.formatLoc(s), s);
    }

    return new Set();
  }

  reconstructPath(
    node: { parent: any; row: number; col: number } | null
  ): any[] {
    if (!node) return [];

    let curr = node,
      path = [];

    while (curr) {
      path.push(this.formatLoc({ row: curr.row, col: curr.col }));
      curr = curr.parent;
    }

    return path;
  }

  isPointInPolygon(
    point: { x: number; y: number },
    polygon: { x: number; y: number }[]
  ) {
    const num_vertices = polygon.length;
    const x = point.x;
    const y = point.y;
    let inside = false;

    let p1 = polygon[0];
    let p2;

    for (let i = 1; i <= num_vertices; i++) {
      p2 = polygon[i % num_vertices];

      if (y > Math.min(p1.y, p2.y)) {
        if (y <= Math.max(p1.y, p2.y)) {
          if (x <= Math.max(p1.x, p2.x)) {
            const x_intersection =
              ((y - p1.y) * (p2.x - p1.x)) / (p2.y - p1.y) + p1.x;

            if (p1.x === p2.x || x <= x_intersection) {
              inside = !inside;
            }
          }
        }
      }

      p1 = p2;
    }

    return inside;
  }

  countEnclosedTiles(map: any[][], polygon: Set<string>): number {
    let count = 0;

    const arr = Array.from(polygon).map((item) => {
      const [row, col] = item.split('-');
      return { x: Number(col), y: Number(row) };
    });
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[0].length; c++) {
        if (
          this.isGround(map, { row: r, col: c }) ||
          !polygon.has(this.formatLoc({ row: r, col: c }))
        ) {
          const inside = this.isPointInPolygon({ x: c, y: r }, arr);
          count += inside ? 1 : 0;
        }
      }
    }

    return count;
  }

  findPaths(map: any[][], curr: { row: number; col: number }): any[] {
    const arr: any[] = [];

    switch (map[curr.row][curr.col]) {
      case '|':
        arr.push({ row: curr.row - 1, col: curr.col });
        arr.push({ row: curr.row + 1, col: curr.col });
        break;
      case '-':
        arr.push({ row: curr.row, col: curr.col - 1 });
        arr.push({ row: curr.row, col: curr.col + 1 });
        break;
      case 'L':
        arr.push({ row: curr.row - 1, col: curr.col });
        arr.push({ row: curr.row, col: curr.col + 1 });
        break;
      case 'J':
        arr.push({ row: curr.row - 1, col: curr.col });
        arr.push({ row: curr.row, col: curr.col - 1 });
        break;
      case '7':
        arr.push({ row: curr.row + 1, col: curr.col });
        arr.push({ row: curr.row, col: curr.col - 1 });
        break;
      case 'F':
        arr.push({ row: curr.row + 1, col: curr.col });
        arr.push({ row: curr.row, col: curr.col + 1 });
        break;
    }

    return arr;
  }

  findStartingPaths(map: any[][], curr: { row: number; col: number }): any[] {
    let node = null;
    const arr: any[] = [];

    // north
    node = { row: curr.row - 1, col: curr.col };
    this.canMove(map, node, ['|', '7', 'F']) && arr.push(node);

    // south
    node = { row: curr.row + 1, col: curr.col };
    this.canMove(map, node, ['|', 'L', 'J']) && arr.push(node);

    // west
    node = { row: curr.row, col: curr.col - 1 };
    this.canMove(map, node, ['-', 'L', 'F']) && arr.push(node);

    // south
    node = { row: curr.row, col: curr.col + 1 };
    this.canMove(map, node, ['-', 'J', '7']) && arr.push(node);

    return arr;
  }

  canMove(
    map: any[][],
    node: { row: number; col: number },
    types: string[]
  ): boolean {
    return (
      this.validNode(map, node) &&
      !this.isGround(map, node) &&
      this.hasPipe(map, node, types)
    );
  }

  hasPipe(
    map: any[][],
    node: { row: number; col: number },
    types: string[]
  ): boolean {
    return types.some((type) => map[node.row][node.col] === type);
  }

  findLoc(map: string[][], type: string): { row: number; col: number } | null {
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[0].length; c++) {
        if (map[r][c] === type) return { row: r, col: c };
      }
    }

    return null;
  }

  validNode(map: string[][], curr: { row: number; col: number }): boolean {
    return (
      curr.row >= 0 &&
      curr.row < map.length &&
      curr.col >= 0 &&
      curr.col < map[0].length
    );
  }

  isGround(map: string[][], curr: { row: number; col: number }): boolean {
    return map[curr.row][curr.col] === '.';
  }

  formatLoc(currPos: { row: number; col: number }) {
    return [currPos.row, currPos.col].join('-');
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
