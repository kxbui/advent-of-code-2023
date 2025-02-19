import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// const NUM_STEPS = 26501365;
const NUM_STEPS = 6;

/**
 * The map is a big diamond shape of free path. Entire perimeter of this diamond is exactly reached
 * after size/2 = 65 steps. Because the corner of the diamond are at the boundary of the map
 * (when thought of as non-periodic), and the middle row and column (where the starting position S is
 * located) are completely free (no rocks #), we are then guaranteed that another 8 surrounding diamonds
 * will be exactly reached after size = 131 steps (in addition to the first size/2 = 65 steps).
 * After another size = 131 steps, the next layer of diamonds are exactly reached, and so on.
 * If we were in the continuous limit and with no rocks #, the number of positions covered as a function
 * of steps would be A(t) = πt² (area of disk), where t is the number of steps. Having discrete steps and
 * dismissing certain positions (adding in rocks) cannot introduce higher-order terms, so the most general
 * form will be A(t) = at² + bt + c. We can determine a, b and c if we know A(t) for three values of t.
 */

// SOLUTION DOES NOT WORK WITH EXAMPLE INPUT!!!
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `...........
.....###.#.
.###.##..#.
..#.#...#..
....#.#....
.##..S####.
.##..#...#.
.......##..
.##.#.####.
.##..##.##.
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

  start(map: string[][]): number {
    const start = this.findStartPosition(map);

    if (start) {
      return this.countGardenPlot(map, start, NUM_STEPS);
    }
    return 0;
  }

  countGardenPlot(
    data: string[][],
    startNode: { row: number; col: number },
    stepCount: number
  ): number {
    const min = 0,
      max = 3;
    let arr = [];
    const length = data.length;
    const halfLength = Math.floor(length / 2);

    for (let i = min; i < max; i++) {
      const x = halfLength + length * i;
      let start = startNode;
      const y = this.move(data, start, Math.abs(x));
      arr.push(y);
    }

    const { a, b, c } = this.simplifiedLagrange(arr);
    return this.evalQuadratic(a, b, c, (stepCount - halfLength) / length);
  }

  evalQuadratic(a: number, b: number, c: number, x: number): number {
    return a * Math.pow(x, 2) + b * x + c;
  }

  simplifiedLagrange(values: number[]): { a: number; b: number; c: number } {
    return {
      a: values[0] / 2 - values[1] + values[2] / 2,
      b: -3 * (values[0] / 2) + 2 * values[1] - values[2] / 2,
      c: values[0],
    };
  }

  move(
    map: string[][],
    startNode: { row: number; col: number },
    stepCount: number
  ): number {
    const oddSet = new Set(),
      evenSet = new Set();
    let open: any[] = [];
    let step = 0;

    open.push({ ...startNode, step: 0 });
    open.push(null);

    while (open.length) {
      const s = open.shift();

      if (s) {
        if (step < stepCount) {
          const currSet = Boolean(step % 2) ? oddSet : evenSet;
          const otherSet = Boolean(step % 2) ? evenSet : oddSet;
          this.getNeighbors(map, s)
            .filter((loc) => !otherSet.has(this.formatLoc(loc)))
            .forEach((neighbor) => {
              open.push({ ...neighbor, step: step + 1 });
              otherSet.add(this.formatLoc(neighbor));
            });
          currSet.add(this.formatLoc(s));
        }
      } else {
        step++;
        if (step < stepCount) {
          open.push(null);
        }
      }
    }
    const currSet = Boolean(step % 2) ? oddSet : evenSet;
    return currSet.size;
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
    ].filter((loc) => !this.isRock(map, loc));
  }

  isRock(map: string[][], curr: { row: number; col: number }) {
    const { row, col } = this.wrapMap(map, curr);
    return map[row][col] === '#';
  }

  wrapMap(map: string[][], curr: { row: number; col: number }) {
    const width = map[0].length;
    const height = map.length;

    const row = curr.row >= 0 ? this.handlePosInd(curr.row, height) : this.handleNegInd(curr.row, height)

    const col = curr.col >= 0 ? this.handlePosInd(curr.col, width) : this.handleNegInd(curr.col, width)

    return { row, col };
  }

  handleNegInd(curr: number, total: number): number {
    return Math.abs(curr) % total
      ? total - (Math.abs(curr) % total)
      : total - (Math.abs(curr) % total) - 1;
  }

  handlePosInd(curr: number, total: number): number {
    return curr >= total
      ? curr % total
      : curr;
  }

  findStartPosition(map: string[][]): { row: number; col: number } | null {
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[0].length; col++) {
        if (map[row][col] === 'S') {
          return { row, col };
        }
      }
    }
    return null;
  }

  formatLoc(currPos: { row: number; col: number }) {
    return [currPos.row, currPos.col]
      .filter((str) => str !== undefined)
      .join(',');
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
