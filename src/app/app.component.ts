import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Solutions:
 * convert all vectors into y = mx + c form
 */

const MIN = 7;
const MAX = 27;

interface HailstoneModel {
  x: number;
  y: number;
  z: number;
  m: number;
  c: number;
  vx: number;
  vy: number;
  vz: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `19, 13, 30 @ -2,  1, -2
18, 19, 22 @ -1, -1, -2
20, 25, 34 @ -2, -2, -4
12, 31, 28 @ -1, -2, -1
20, 19, 15 @  1, -5, -3`;

  result = signal('');
  ngZone = inject(NgZone);

  onSubmit() {
    this.result.set(`...waiting`);

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const data = this.parseRow(this.input);
        const list = data.map((item) => this.parseHailstoneModel(item))
        const total = this.start(list);
        this.result.set(`${total}`);
      }, 0);
    });
  }

  start(data: HailstoneModel[]): number {
    let count = 0;
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        const intersection = this.getIntersection(data[i], data[j]);
        if (intersection && this.isInBounds(intersection)) {
          count++;
        }
      }
    }
    return count;
  }

  isInBounds(point: { x: number; y: number }): boolean {
    return point.x >= MIN && point.x <= MAX && point.y >= MIN && point.y <= MAX;
  }

  getIntersection(data1: HailstoneModel, data2: HailstoneModel): { x: number; y: number } | null {
    const { m: m1, c: c1 } = data1;
    const { m: m2, c: c2 } = data2;

    if (m1 === m2) {
      return null; // Parallel lines
    }

    const x = (c2 - c1) / (m1 - m2);
    const y = m1 * x + c1;

    /**
     * Looking at the vector, you can tell if a particle is moving to the right (positive x change) 
     * or to the left (negative x change). If the intersection point has a higher x 
     * than the starting point, but the vector is showing a negative change to x, 
     * that means the intersection was in the past for that particle, and vice versa.
     */
    if ((x > data1.x && data1.vx < 0) || (x < data1.x && data1.vx > 0)) {
      return null;
    } else if ((x > data2.x && data2.vx < 0) || (x < data2.x && data2.vx > 0)) {
      return null;
    }

    return { x, y };
  }

  parseHailstoneModel(str: string): HailstoneModel {
    const [position, velocity] = str.split('@').map((part) => part.trim());
    const [x, y, z] = position.split(',').map((num) => this.getDigit(num));
    const [vx, vy, vz] = velocity.split(',').map((num) => this.getDigit(num));
    const m = this.calculateSlope({ x, y }, { x: x + vx, y: y + vy });
    const c = this.calculateIntercept({ x, y }, m);
    return { x, y, z, m, c, vx, vy, vz };
  }

  calculateIntercept(p1: { x: number; y: number }, m: number): number {
    return p1.y - m * p1.x;
  }

  calculateSlope(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return dx !== 0 ? dy / dx : Infinity;
  }

  getDigit(str: string): number {
    return parseInt(str.replace(/^-\D+/g, ''));
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
