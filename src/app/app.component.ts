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
  input = `.|...\\....
|.-.\\.....
.....|-...
........|.
..........
.........\\
..../.\\\\..
.-.-/..|..
.|....-|.\\
..//.|....`;

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
    return this.search(data, { row: 0, col: 0, direction: 'E' });
  }

  search(
    map: any[][],
    start: { row: number; col: number; direction: string }
  ): number {
    const visited = new Set<string>();
    const queue: any[] = [];

    queue.push(start);

    while (queue.length) {
      const s = queue.shift();
      if (s) {
        const paths = this.findPaths(map, s);
        paths
          .filter((path) => !visited.has(this.formatLoc(path)))
          .forEach((path) => {
            const node = { ...path };
            queue.push(node);
          });
      }
      visited.add(this.formatLoc(s));
    }

    const locations = new Set(
      Array.from(visited.values()).map((val: string) => {
        const [r, c] = val.split('-');
        return this.formatLoc({ row: Number(r), col: Number(c) });
      })
    );
    return locations.size;
  }

  findPaths(
    map: any[][],
    curr: { row: number; col: number; direction: string }
  ): any[] {
    const arr: any[] = [];

    switch (map[curr.row][curr.col]) {
      case '.':
        return this.handleEmptySpace(map, curr);
      case '/':
        return this.handleForwardMirror(map, curr);
      case '\\':
        return this.handleBackwardMirror(map, curr);
      case '|':
        return this.handleVerticalSplitter(map, curr);
      case '-':
        return this.handleHorizontalSplitter(map, curr);
    }

    return arr;
  }

  handleEmptySpace(
    map: any[][],
    curr: { row: number; col: number; direction: string }
  ): any[] {
    switch (curr.direction) {
      case 'N':
        return this.validNodes(map, [
          { ...curr, row: curr.row - 1, col: curr.col },
        ]);
      case 'S':
        return this.validNodes(map, [
          { ...curr, row: curr.row + 1, col: curr.col },
        ]);
      case 'E':
        return this.validNodes(map, [
          { ...curr, row: curr.row, col: curr.col + 1 },
        ]);
      case 'W':
        return this.validNodes(map, [
          { ...curr, row: curr.row, col: curr.col - 1 },
        ]);
    }
    return [];
  }

  handleForwardMirror(
    map: any[][],
    curr: { row: number; col: number; direction: string }
  ): any[] {
    switch (curr.direction) {
      case 'N':
        return this.validNodes(map, [
          { row: curr.row, col: curr.col + 1, direction: 'E' },
        ]);
      case 'S':
        return this.validNodes(map, [
          { row: curr.row, col: curr.col - 1, direction: 'W' },
        ]);
      case 'E':
        return this.validNodes(map, [
          { row: curr.row - 1, col: curr.col, direction: 'N' },
        ]);
      case 'W':
        return this.validNodes(map, [
          { row: curr.row + 1, col: curr.col, direction: 'S' },
        ]);
    }
    return [];
  }

  handleBackwardMirror(
    map: any[][],
    curr: { row: number; col: number; direction: string }
  ): any[] {
    switch (curr.direction) {
      case 'N':
        return this.validNodes(map, [
          { row: curr.row, col: curr.col - 1, direction: 'W' },
        ]);
      case 'S':
        return this.validNodes(map, [
          { row: curr.row, col: curr.col + 1, direction: 'E' },
        ]);
      case 'E':
        return this.validNodes(map, [
          { row: curr.row + 1, col: curr.col, direction: 'S' },
        ]);
      case 'W':
        return this.validNodes(map, [
          { row: curr.row - 1, col: curr.col, direction: 'N' },
        ]);
    }
    return [];
  }

  handleHorizontalSplitter(
    map: any[][],
    curr: { row: number; col: number; direction: string }
  ): any[] {
    switch (curr.direction) {
      case 'N':
      case 'S':
        return this.validNodes(map, [
          { row: curr.row, col: curr.col - 1, direction: 'W' },
          { row: curr.row, col: curr.col + 1, direction: 'E' },
        ]);
      case 'E':
        return this.validNodes(map, [
          { ...curr, row: curr.row, col: curr.col + 1 },
        ]);
      case 'W':
        return this.validNodes(map, [
          { ...curr, row: curr.row, col: curr.col - 1 },
        ]);
    }
    return [];
  }

  handleVerticalSplitter(
    map: any[][],
    curr: { row: number; col: number; direction: string }
  ): any[] {
    switch (curr.direction) {
      case 'N':
        return this.validNodes(map, [
          { ...curr, row: curr.row - 1, col: curr.col },
        ]);
      case 'S':
        return this.validNodes(map, [
          { ...curr, row: curr.row + 1, col: curr.col },
        ]);
      case 'E':
      case 'W':
        return this.validNodes(map, [
          { row: curr.row - 1, col: curr.col, direction: 'N' },
          { row: curr.row + 1, col: curr.col, direction: 'S' },
        ]);
    }
    return [];
  }

  validNodes(map: any[][], arr: any[]): any[] {
    return arr.filter((node) => this.validNode(map, node));
  }

  validNode(map: string[][], curr: { row: number; col: number }): boolean {
    return (
      curr.row >= 0 &&
      curr.row < map.length &&
      curr.col >= 0 &&
      curr.col < map[0].length
    );
  }

  formatLoc(currPos: { row: number; col: number; direction?: string }) {
    return [currPos.row, currPos.col, currPos.direction]
      .filter((val) => val != undefined)
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
