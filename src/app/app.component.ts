import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const ROUNDED = 'O';
const CUBED = '#';
const EMPTY = '.';
const NUM_CYCLES = 1000000000;

/**
 * There're repeating patterns
 * find the cycle length and skip ahead
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `O....#....
O.OO#....#
.....##...
OO.#O....O
.O.....O#.
O.#..O.#.#
..O..#O..O
.......O..
#....###..
#OO..#....`;

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
    const map = new Map<number, Set<string>>();
    let count = 0,
      curr = null,
      patternStartIdx = -1;

    while (patternStartIdx < 0) {
      const result = this.tiltPlatform(data);
      curr = this.getRounded(result);
      patternStartIdx = this.patternExists(map, curr);
      if (patternStartIdx < 0) {
        map.set(count, curr);
        count++;
      }
    }
    const patterns = Array.from(map.values()).slice(patternStartIdx);
    const idx = (NUM_CYCLES - patternStartIdx - 1) % patterns.length;
    return this.countTotalLoad(patterns[idx], data.length);
  }

  patternExists(
    map: Map<number, Set<string>>,
    curr: Set<string> | null
  ): number {
    return curr
      ? Array.from(map.values()).findIndex((set) =>
          this.areSetsEqual(set, curr)
        )
      : -1;
  }

  countTotalLoad(set: Set<string>, length: number): number {
    let total = 0;

    Array.from(set.values()).forEach((rock) => {
      const [row] = rock.split('-');
      total += (length - Number(row));
    });
    return total;
  }

  tiltPlatform(map: string[][]): string[][] {
    let data = this.tiltNorth(map);
    data = this.tiltWest(data);
    data = this.tiltSouth(data);
    data = this.tiltEast(data);

    return data;
  }

  tiltNorth(map: string[][]): string[][] {
    for (let c = 0; c < map[0].length; c++) {
      for (let r = 1; r < map.length; r++) {
        if (map[r][c] === ROUNDED) {
          const empty = this.findNorthEmptySpace(map, { row: r, col: c });
          if (empty) {
            map = this.swap(
              map,
              { row: r, col: c },
              { row: empty.row, col: empty.col }
            );
          }
        }
      }
    }
    return map;
  }

  tiltWest(map: string[][]): string[][] {
    for (let r = 0; r < map.length; r++) {
      for (let c = 1; c < map[0].length; c++) {
        if (map[r][c] === ROUNDED) {
          const empty = this.findWestEmptySpace(map, { row: r, col: c });
          if (empty) {
            map = this.swap(
              map,
              { row: r, col: c },
              { row: empty.row, col: empty.col }
            );
          }
        }
      }
    }
    return map;
  }

  tiltSouth(map: string[][]): string[][] {
    for (let c = 0; c < map[0].length; c++) {
      for (let r = map.length - 2; r >= 0; r--) {
        if (map[r][c] === ROUNDED) {
          const empty = this.findSouthEmptySpace(map, { row: r, col: c });
          if (empty) {
            map = this.swap(
              map,
              { row: r, col: c },
              { row: empty.row, col: empty.col }
            );
          }
        }
      }
    }
    return map;
  }

  tiltEast(map: string[][]): string[][] {
    for (let r = 0; r < map.length; r++) {
      for (let c = map[0].length - 2; c >= 0; c--) {
        if (map[r][c] === ROUNDED) {
          const empty = this.findEastEmptySpace(map, { row: r, col: c });
          if (empty) {
            map = this.swap(
              map,
              { row: r, col: c },
              { row: empty.row, col: empty.col }
            );
          }
        }
      }
    }
    return map;
  }

  findNorthEmptySpace(
    map: string[][],
    curr: { row: number; col: number }
  ): { row: number; col: number } | null {
    let result = null;

    for (let r = curr.row - 1; r >= 0; r--) {
      if ([CUBED, ROUNDED].includes(map[r][curr.col])) {
        return result;
      } else if (map[r][curr.col] === EMPTY) {
        result = { row: r, col: curr.col };
      }
    }
    return result;
  }

  findWestEmptySpace(
    map: string[][],
    curr: { row: number; col: number }
  ): { row: number; col: number } | null {
    let result = null;

    for (let c = curr.col - 1; c >= 0; c--) {
      if ([CUBED, ROUNDED].includes(map[curr.row][c])) {
        return result;
      } else if (map[curr.row][c] === EMPTY) {
        result = { row: curr.row, col: c };
      }
    }
    return result;
  }

  findSouthEmptySpace(
    map: string[][],
    curr: { row: number; col: number }
  ): { row: number; col: number } | null {
    let result = null;

    for (let r = curr.row + 1; r < map.length; r++) {
      if ([CUBED, ROUNDED].includes(map[r][curr.col])) {
        return result;
      } else if (map[r][curr.col] === EMPTY) {
        result = { row: r, col: curr.col };
      }
    }
    return result;
  }

  findEastEmptySpace(
    map: string[][],
    curr: { row: number; col: number }
  ): { row: number; col: number } | null {
    let result = null;

    for (let c = curr.col + 1; c < map[0].length; c++) {
      if ([CUBED, ROUNDED].includes(map[curr.row][c])) {
        return result;
      } else if (map[curr.row][c] === EMPTY) {
        result = { row: curr.row, col: c };
      }
    }
    return result;
  }

  swap(
    map: string[][],
    obj1: { row: number; col: number },
    obj2: { row: number; col: number }
  ): string[][] {
    const temp = map[obj1.row][obj1.col];
    map[obj1.row][obj1.col] = map[obj2.row][obj2.col];
    map[obj2.row][obj2.col] = temp;
    return map;
  }

  getRounded(map: string[][]): Set<string> {
    const set = new Set<string>();
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[0].length; c++) {
        if (map[r][c] === ROUNDED) set.add(this.formatLoc({ row: r, col: c }));
      }
    }
    return set;
  }

  areSetsEqual(set1: Set<string> | null, set2: Set<string> | null) {
    if (set1 === null || set2 === null) return false;

    if (set1.size !== set2.size) {
      return false;
    }

    for (const item of set1) {
      if (!set2.has(item)) {
        return false;
      }
    }

    return true;
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
