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
  input = `#.#####################
#.......#########...###
#######.#########.#.###
###.....#.>.>.###.#.###
###v#####.#v#.###.#.###
###.>...#.#.#.....#...#
###v###.#.#.#########.#
###...#.#.#.......#...#
#####.#.#.#######.#.###
#.....#.#.#.......#...#
#.#####.#.#.#########v#
#.#...#...#...###...>.#
#.#.#v#######v###.###v#
#...#.>.#...>.>.#.###.#
#####v#.#.###v#.#.###.#
#.....#...#...#.#.#...#
#.#########.###.#.#.###
#...###...#...#...#.###
###.###.#.###v#####v###
#...#...#.#.>.>.#.>.###
#.###.###.#.###.#.#v###
#.....###...###...#...#
#####################.#`;

  result = signal('');
  ngZone = inject(NgZone);

  onSubmit() {
    this.result.set(`...waiting`);

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const data = this.parseRow(this.input).map((item) => item.split(''));
        const total = this.start(data);
        this.result.set(`${total}`);
      }, 0);
    });
  }

  start(data: string[][]): number {
    const start = this.findAvailablePosition(data, 0);
    const end = this.findAvailablePosition(data, data.length - 1);
    return this.countMaxSteps(data, start, end);
  }

  countMaxSteps(
    map: string[][],
    start: { row: number; col: number },
    end: { row: number; col: number }
  ): number {
    const queue: any[] = [
      { ...start, total: 0, visited: new Set([this.formatLoc(start)]) },
    ];
    let max = 0;

    while (queue.length) {
      const s = queue.pop();
      if (s) {
        if (s.row === end.row && s.col === end.col) {
          if (s.total > max) {
            max = s.total;
          }
        } else {
          const paths = this.getNeighbors(map, s);

          paths
            .filter((path) => !s.visited.has(this.formatLoc(path)))
            .forEach((path) => {
              const visited = new Set([...s.visited, this.formatLoc(path)]);
              const node = { ...path, total: s.total + 1, visited };
              queue.push(node);
            });
        }
      }
    }

    return max;
  }

  getNeighbors(map: string[][], curr: { row: number; col: number }): any[] {
    if (map[curr.row][curr.col] !== '.') return [this.stepOnSlope(map, curr)];
    return [
      // left
      { row: curr.row, col: curr.col - 1 },
      // right
      { row: curr.row, col: curr.col + 1 },
      // top
      { row: curr.row - 1, col: curr.col },
      // bottom
      { row: curr.row + 1, col: curr.col },
    ].filter((loc) => this.canMove(map, loc));
  }

  canMove(map: string[][], curr: { row: number; col: number }) {
    return this.validNode(map, curr) && map[curr.row][curr.col] !== '#';
  }

  stepOnSlope(map: string[][], curr: { row: number; col: number }) {
    if (map[curr.row][curr.col] === '>')
      return { row: curr.row, col: curr.col + 1 };
    else if (map[curr.row][curr.col] === '<')
      return { row: curr.row, col: curr.col - 1 };
    else if (map[curr.row][curr.col] === '^')
      return { row: curr.row - 1, col: curr.col };
    else return { row: curr.row + 1, col: curr.col };
  }

  findAvailablePosition(
    map: string[][],
    row: number
  ): { row: number; col: number } {
    for (let col = 0; col < map[0].length; col++) {
      if (map[row][col] === '.') {
        return { row, col };
      }
    }
    return { row: -1, col: -1 };
  }

  validNode(map: any[][], node: { row: number; col: number }) {
    const width = map[0].length;
    const height = map.length;

    return (
      node.row >= 0 && node.row < height && node.col >= 0 && node.col < width
    );
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
