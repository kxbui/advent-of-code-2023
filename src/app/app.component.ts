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
  input = `467..114..
...*......
..35..633.
......#...
617*......
.....+.58.
..592.....
......755.
...$.*....
.664.598..`;

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

  start(arr: string[][]): number {
    const map = new Map<string, number[]>();
    let digit = '';
    let set = new Set<string>();

    for (let r = 0; r < arr.length; r++) {
      for (let c = 0; c < arr[0].length; c++) {
        if (this.isDigit(arr[r][c])) {
          digit += arr[r][c];
          const stars = this.checkNeighbors(arr, { row: r, col: c });
          set = new Set([...set, ...stars]);
        } else {
          Array.from(set.values()).forEach((loc) => {
            map.has(loc)
              ? map.set(loc, [...map.get(loc)!, Number(digit)])
              : map.set(loc, [Number(digit)]);
          });
          digit = '';
          set.clear();
        }
      }
    }
    return Array.from(map.entries())
      .filter(([_, value]) => value.length === 2)
      .reduce((total, [_, value]) => total + (Number(value[0]) * Number(value[1])), 0);
  }

  checkNeighbors(
    map: string[][],
    curr: { row: number; col: number }
  ): string[] {
    return [
      // left
      { row: curr.row, col: curr.col - 1 },
      // right
      { row: curr.row, col: curr.col + 1 },
      // top
      { row: curr.row - 1, col: curr.col },
      // bottom
      { row: curr.row + 1, col: curr.col },
      // top-left
      { row: curr.row - 1, col: curr.col - 1 },
      // top-right
      { row: curr.row - 1, col: curr.col + 1 },
      // bottom-left
      { row: curr.row + 1, col: curr.col - 1 },
      // bottom-right
      { row: curr.row + 1, col: curr.col + 1 },
    ]
      .filter((loc) => this.isStar(map, loc))
      .map((item) => this.formatLoc(item));
  }

  isStar(map: string[][], curr: { row: number; col: number }): boolean {
    const width = map[0].length;
    const height = map.length;
    return (
      curr.row >= 0 &&
      curr.row < height &&
      curr.col >= 0 &&
      curr.col < width &&
      map[curr.row][curr.col] === '*'
    );
  }

  isDigit(str: string): boolean {
    return !Number.isNaN(parseInt(str.replace(/^\D+/g, '')));
  }

  formatLoc(currPos: { row: number; col: number }) {
    return [currPos.row, currPos.col].join('-');
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
