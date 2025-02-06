import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Use Pick's theorem
 * Area  = I + B/2 - 1
 * I : stands for the number of points in the interior of the shape,
 * B : stands for the number of points on the boundary of the shape.
 *
 * In this problem, need to find I
 * To find Area, use shoelace formula
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `R 6 (#70c710)
D 5 (#0dc571)
L 2 (#5713f0)
D 2 (#d2c081)
R 2 (#59c680)
D 2 (#411b91)
L 5 (#8ceee2)
U 2 (#caa173)
L 1 (#1b58a2)
U 2 (#caa171)
R 2 (#7807d2)
U 3 (#a77fa3)
L 2 (#015232)
U 2 (#7a21e3)`;

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
    const digPlan = this.parseInput(data);
    return this.findInteriorPoints(digPlan);
  }

  /**
   * Use Pick's theorem
   */
  findInteriorPoints(data: any[]): number {
    let nodes: any[] = [],
      currWidth = 0,
      currHeight = 0;

    data.forEach(({ direction, amount }) => {
      const { row, col } = this.getIncrementalAmount(direction);
      for (let i = 0; i < amount; i++) {
        currWidth += col;
        currHeight += row;
        nodes.push({ row: currHeight, col: currWidth });
      }
    });

    const area = this.findArea(nodes);
    return area + nodes.length / 2 + 1;
  }

  /**
   * Use shoelace formula
   */
  findArea(nodes: any[]): number {
    let sum1 = 0,
      sum2 = 0;

    for (let i = 0; i < nodes.length - 1; i++) {
      sum1 += nodes[i].row * nodes[i + 1].col;
      sum2 += nodes[i].col * nodes[i + 1].row;
    }

    sum1 += nodes[nodes.length - 1].row * nodes[0].col;
    sum2 += nodes[0].row * nodes[nodes.length - 1].col;

    return Math.abs(sum1 - sum2) / 2;
  }

  getIncrementalAmount(direction: string): { row: number; col: number } {
    switch (direction) {
      case 'L':
        return { row: 0, col: -1 };
      case 'R':
        return { row: 0, col: 1 };
      case 'U':
        return { row: -1, col: 0 };
      case 'D':
        return { row: 1, col: 0 };
    }
    return { row: 0, col: 0 };
  }

  parseInput(data: string[]): any[] {
    return data.map((item) => {
      const [direction, amount] = item.split(/\s*[\s,]\s*/);
      return { direction, amount: Number(amount) };
    });
  }

  formatLoc(currPos: { row: number; col: number; direction: string }) {
    return [currPos.row, currPos.col, currPos.direction]
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
