import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const X = 0,
  Y = 1,
  Z = 2;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `1,0,1~1,2,1
0,0,2~2,0,2
0,2,3~2,2,3
0,0,4~0,2,4
2,0,5~2,2,5
0,1,6~2,1,6
1,1,8~1,1,9`;

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

  start(data: any[]): number {
    let list = this.parseInput(data);

    return this.countTotalFallingBricks(list);
  }

  countTotalFallingBricks(data: any[]): number {
    const supportedBy = this.getSupportBricks(data);

    return data.reduce((total, _, i) => {
      return (total += this.countFallingBricks(i, supportedBy));
    }, 0);
  }

  getSupportBricks(data: any[]): Map<number, number[]> {
    const list = data.sort(
      (a, b) => Math.min(a[0][Z], a[1][Z]) - Math.min(b[0][Z], b[1][Z])
    );
    const zMap = new Map<number, Set<number>>();
    const supportedBy = new Map<number, number[]>();

    list.forEach((brick, i) => {
      const result = this.dropBrick(brick, list, zMap);
      const { z, supporters } = result;
      zMap.has(z)
        ? zMap.set(z, new Set([...zMap.get(z)!, i]))
        : zMap.set(z, new Set([i]));

      supportedBy.set(i, supporters);
    });

    return supportedBy;
  }

  countFallingBricks(idx: number, supportedBy: Map<number, number[]>): number {
    let queue: number[] = [idx];
    const close = new Set();
    const supportedByArr = Array.from(supportedBy.entries());

    while (queue.length) {
      const set = new Set([...close, ...queue])
      const fallingBricks = supportedByArr
        .filter(([_, list]) => {
          let uniqueOfBoth = list.filter((ele) => set.has(ele));
          return (
            uniqueOfBoth.length &&
            list.filter((ele) => !uniqueOfBoth.includes(ele)).length === 0
          );
        })
        .map(([key]) => key);

      queue.forEach((item) => close.add(item));
      queue = [...fallingBricks.filter(item => !close.has(item))];
    }
    close.delete(idx);
    return close.size;
  }

  dropBrick(
    brick: any[][],
    list: any[],
    map: Map<number, Set<number>>
  ): { z: number; supporters: number[] } {
    const startZ = Math.min(brick[0][Z], brick[1][Z]);
    const endZ = Math.max(brick[0][Z], brick[1][Z]);

    if (startZ === 1) {
      return { z: endZ, supporters: [] };
    }

    for (let z = endZ; z > 0; z--) {
      const brickList = map.get(z);
      if (brickList) {
        const supporters = Array.from(brickList.values()).filter((brickIdx) =>
          this.hasCollision(brick, list[brickIdx])
        );
        if (supporters.length) {
          return {
            z: z + (endZ === startZ ? 1 : endZ - startZ + 1),
            supporters,
          };
        }
      }
    }

    return { z: endZ === startZ ? 1 : endZ - startZ, supporters: [] };
  }

  hasCollision(brickA: any[][], brickB: any[][]): boolean {
    return (
      this.hasCollisionX(brickA, brickB) && this.hasCollisionY(brickA, brickB)
    );
  }

  hasCollisionX(brickA: any[][], brickB: any[][]): boolean {
    return [
      this.inRange(brickA[0][X], { start: brickB[0][X], end: brickB[1][X] }),
      this.inRange(brickA[1][X], { start: brickB[0][X], end: brickB[1][X] }),
      this.inRange(brickB[0][X], { start: brickA[0][X], end: brickA[1][X] }),
      this.inRange(brickB[1][X], { start: brickA[0][X], end: brickA[1][X] }),
    ].some(Boolean);
  }

  hasCollisionY(brickA: any[][], brickB: any[][]): boolean {
    return [
      this.inRange(brickA[0][Y], { start: brickB[0][Y], end: brickB[1][Y] }),
      this.inRange(brickA[1][Y], { start: brickB[0][Y], end: brickB[1][Y] }),
      this.inRange(brickB[0][Y], { start: brickA[0][Y], end: brickA[1][Y] }),
      this.inRange(brickB[1][Y], { start: brickA[0][Y], end: brickA[1][Y] }),
    ].some(Boolean);
  }

  inRange(value: number, range: { start: number; end: number }): boolean {
    return value >= range.start && value <= range.end;
  }

  parseInput(data: string[]): number[][][] {
    const arr: any[] = [];

    data.forEach((line) => {
      const [sideA, sideB] = line.split('~');
      arr.push([
        sideA.split(',').map((str) => Number(str)),
        sideB.split(',').map((str) => Number(str)),
      ]);
    });

    return arr;
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
