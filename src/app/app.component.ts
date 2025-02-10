import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

// const NUM_STEPS = 64;
const NUM_STEPS = 6;

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
      return this.move(map, [start], 0);
    }
    return 0;
  }

  move(map: string[][], startNodes: any[], stepCount: number): number {
    let arr: any[] = [];
    let set = new Set<string>();

    startNodes.forEach((node) => {
      set = new Set([
        ...set,
        ...this.getNeighbors(map, node).map((loc) => this.formatLoc(loc)),
      ]);
    });

    arr = Array.from(set.values()).map((str) => {
      const [r, c] = str.split('-');
      return { row: Number(r), col: Number(c) };
    });

    if (stepCount === NUM_STEPS - 1) {
      return arr.length;
    }

    return this.move(map, arr, stepCount + 1);
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
    return map[curr.row][curr.col] === '#';
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
