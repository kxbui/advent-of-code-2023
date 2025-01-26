import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const EXPANSION = 1000000;
const GALAXY = '#';

/**
 * Use BFS
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `...#......
.......#..
#.........
..........
......#...
.#........
.........#
..........
.......#..
#...#.....`;

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
    const expansion = this.expandMap(data);
    return this.findShortestPaths(data, expansion);
  }

  findShortestPaths(
    map: any[][],
    expansion: { rows: number[]; cols: number[] }
  ): number {
    const galaxies = this.getAllGalaxies(map);

    let total = 0;
    for (let x = 0; x < galaxies.length - 1; x++) {
      for (let y = x + 1; y < galaxies.length; y++) {
        total += this.search(galaxies[x], galaxies[y], expansion);
      }
    }

    return total;
  }

  search(
    start: { row: number; col: number },
    end: { row: number; col: number },
    expansion: { rows: number[]; cols: number[] }
  ): number {
    const visited = new Map<string, any>();
    const queue: any[] = [];

    visited.set(this.formatLoc(start), start);
    this.findPaths(start, end).forEach((loc) => queue.push(loc));

    while (queue.length) {
      const s = queue.shift();
      if (s) {
        if (s.row === end.row && s.col === end.col) {
          return this.countSteps(s, expansion);
        }
        const paths = this.findPaths(s, end);
        paths
          .filter((path) => !visited.has(this.formatLoc(path)))
          .forEach((path) => {
            const node = { ...path, parent: s };
            queue.push(node);
          });
      }
      visited.set(this.formatLoc(s), s);
    }

    return 0;
  }

  countSteps(
    node: { parent: any; row: number; col: number } | null,
    expansion: { rows: number[]; cols: number[] }
  ): number {
    if (!node) 0;

    let curr = node,
      count = 0;

    while (curr) {
      expansion.rows.includes(curr.row) || expansion.cols.includes(curr.col)
        ? (count += EXPANSION)
        : count++;
      curr = curr.parent;
    }

    return count;
  }

  findPaths(
    curr: { row: number; col: number },
    end: { row: number; col: number }
  ): any[] {
    if (curr.row < end.row) {
      return [{ row: curr.row + 1, col: curr.col }];
    }

    if (curr.col > end.col) {
      return [{ row: curr.row, col: curr.col - 1 }];
    }

    if (curr.col < end.col) {
      return [{ row: curr.row, col: curr.col + 1 }];
    }

    return [];
  }

  getAllGalaxies(map: string[][]): { row: number; col: number }[] {
    const arr = [];
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[0].length; c++) {
        if (map[r][c] === GALAXY) arr.push({ row: r, col: c });
      }
    }
    return arr;
  }

  expandMap(map: string[][]): { rows: number[]; cols: number[] } {
    const rows = this.expandRows(map);
    const cols = this.expandCols(map);

    return { rows, cols };
  }

  expandRows(map: string[][]): number[] {
    let r = 0;

    const arr = [];
    while (r < map.length) {
      let hasGalaxy = false;
      for (let c = 0; c < map[0].length; c++) {
        if (map[r][c] === GALAXY) {
          hasGalaxy = true;
          break;
        }
      }
      if (!hasGalaxy) {
        arr.push(r);
      }
      r++;
    }

    return arr;
  }

  expandCols(map: string[][]): number[] {
    let c = 0;

    let arr = [];

    while (c < map[0].length) {
      let hasGalaxy = false;
      for (let r = 0; r < map.length; r++) {
        if (map[r][c] === GALAXY) {
          hasGalaxy = true;
          break;
        }
      }
      if (!hasGalaxy) {
        arr.push(c);
      }
      c++;
    }

    return arr;
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
