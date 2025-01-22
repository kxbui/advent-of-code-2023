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

  start(map: string[][]): number {
    let digit = '';
    let total = 0;
    let isIncluded = false;
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[0].length; c++) {
        if (this.isDigit(map[r][c])) {
          digit += map[r][c];
          isIncluded = !isIncluded
            ? this.checkNeighbors(map, { row: r, col: c })
            : isIncluded;
        } else {
          total += isIncluded ? Number(digit) : 0;
          digit = '';
          isIncluded = false;
        }
      }
    }
    return total;
  }

  checkNeighbors(map: string[][], curr: { row: number; col: number }): boolean {
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
    ].some((loc) => this.isSymbol(map, loc));
  }

  isSymbol(map: string[][], curr: { row: number; col: number }): boolean {
    const width = map[0].length;
    const height = map.length;
    return (
      curr.row >= 0 &&
      curr.row < height &&
      curr.col >= 0 &&
      curr.col < width &&
      map[curr.row][curr.col] !== '.' &&
      !this.isDigit(map[curr.row][curr.col])
    );
  }

  isDigit(str: string): boolean {
    return !Number.isNaN(parseInt(str.replace(/^\D+/g, '')));
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
