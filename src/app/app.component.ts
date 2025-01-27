import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const UNKNOWN = '?';
const DAMAGED = '#';
const OPERATIONAL = '.';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `???.### 1,1,3
.??..??...?##. 1,1,3
?#?#?#?#?#?#?#? 1,3,1,6
????.#...#... 4,1,1
????.######..#####. 1,6,5
?###???????? 3,2,1`;

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
    const arr = this.parseInput(data);
    let total = 0;

    arr.forEach((line) => {
      total += this.countArrangements(line.spring, line.size, 0);
    });

    return total;
  }

  countArrangements(spring: string, size: string, total: number): number {
    const unknownIdx = spring.indexOf(UNKNOWN);

    if (unknownIdx < 0) {
      return this.matchSize(spring, size);
    }

    return (
      this.countArrangements(
        spring.replace(UNKNOWN, OPERATIONAL),
        size,
        total
      ) + this.countArrangements(spring.replace(UNKNOWN, DAMAGED), size, total)
    );
  }

  matchSize(spring: string, size: string): number {
    const arr = [];
    let count = 0;

    for (let i = 0; i <= spring.length; i++) {
      if (i === spring.length) count > 0 && arr.push(count);
      else if (spring[i] === DAMAGED) count++;
      else {
        count > 0 && arr.push(count);
        count = 0;
      }
    }
    return Number(arr.join(',') === size);
  }

  parseInput(data: string[]): { spring: string; size: string }[] {
    const arr: any[] = [];

    data.forEach((line) => {
      const [spring, size] = line.split(' ');
      arr.push({ spring, size });
    });

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
