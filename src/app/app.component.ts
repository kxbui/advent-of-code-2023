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
  input = `#.##..##.
..#.##.#.
##......#
##......#
..#.##.#.
..##..##.
#.#.##.#.

#...##..#
#....#..#
..##..###
#####.##.
#####.##.
..##..###
#....#..#`;

  result = signal('');
  ngZone = inject(NgZone);

  onSubmit() {
    this.result.set(`...waiting`);

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const data = this.parseRow(this.input);
        const total = this.start(data);
        this.result.set(`${total}`);
      }, 0);
    });
  }

  start(data: string[]): number {
    let total = 0;
    const list = this.parseInput(data);

    list.forEach((pattern) => {
      total += this.countReflection(pattern);
    });

    return total;
  }

  countReflection(arr: string[]): number {
    const vert = this.countVertical(arr);
    const horz = this.countHorizontal(arr);
    return vert + 100 * horz;
  }

  countVertical(arr: string[]): number {
    const map = new Map<number, string>();
    for (let c = 0; c < arr[0].length; c++) {
      let str = '';
      for (let r = 0; r < arr.length; r++) {
        str += arr[r][c];
      }
      map.set(c, str);
    }

    for (let c = 0; c < arr[0].length - 1; c++) {
      if (this.compareStr(map.get(c), map.get(c + 1))) {
        if (this.checkReflection(map, c)) {
          return c + 1;
        }
      }
    }

    return 0;
  }

  countHorizontal(arr: string[]): number {
    const map = new Map(arr.map((str, i) => [i, str]));

    for (let r = 0; r < arr.length - 1; r++) {
      if (this.compareStr(arr[r], arr[r + 1])) {
        if (this.checkReflection(map, r)) {
          return r + 1;
        }
      }
    }
    return 0;
  }

  checkReflection(map: Map<number, string>, midIdx: number): boolean {
    let sideA = midIdx,
      sideB = midIdx + 1;

    while (sideA >= 0) {
      const valA = map.get(sideA);
      const valB = map.get(sideB);

      if (valA && valB && !this.compareStr(valA, valB)) {
        return false;
      }

      sideA--;
      sideB++;
    }

    return true;
  }

  compareStr(str1: string | undefined, str2: string | undefined): boolean {
    return str1 === str2;
  }

  parseInput(input: string[]): any[][] {
    const arr: any[][][] = [];
    let count = 0,
      temp: any[] = [];

    while (count <= input.length) {
      if (count === input.length) {
        arr.push(temp);
      } else if (input[count].trim()) {
        temp.push(input[count]);
      } else {
        arr.push(temp);
        temp = [];
      }
      count++;
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
