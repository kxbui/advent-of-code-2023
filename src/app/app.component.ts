import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const ROUNDED = 'O';
const CUBED = '#';
const EMPTY = '.';

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
    const map = this.tiltPlatform(data);
    return this.countTotalLoad(map);
  }

  countTotalLoad(data: string[][]): number {
    let total = 0;

    for (let r = 0; r < data.length; r++) {
      let rocks = 0;
      for (let c = 0; c < data[0].length; c++) {
        rocks += data[r][c] === ROUNDED ? 1 : 0;
      }
      total += rocks * (data.length - r);
    }
    return total;
  }

  tiltPlatform(map: string[][]): string[][] {
    for (let c = 0; c < map[0].length; c++) {
      for (let r = 1; r < map.length; r++) {
        if (map[r][c] === ROUNDED) {
          const empty = this.findEmptySpace(map, { row: r, col: c });
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

  findEmptySpace(
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
