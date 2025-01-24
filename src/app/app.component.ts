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
  input = `Time:      7  15   30
Distance:  9  40  200`;

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
    const { time, distance } = this.parseInput(data);
    return this.countOptions(0, time, distance);
  }

  countOptions(startTime: number, endTime: number, distance: number): number {
    const mid = Math.ceil((endTime - startTime) / 2);
    const start = this.countLeft(startTime, mid, endTime, distance);
    const end = this.countRight(mid + 1, endTime, endTime, distance);

    return end - start + 1;
  }

  countLeft(
    startTime: number,
    endTime: number,
    totalTime: number,
    distance: number
  ): number {
    if (endTime - startTime === 0) {
      return startTime;
    }

    const mid = Math.ceil((endTime - startTime) / 2);
    if ((totalTime - mid) * mid > distance) {
      return this.countLeft(startTime, mid, totalTime, distance);
    }

    let count = mid;
    while (count <= endTime) {
      if ((totalTime - count) * count > distance) {
        return count;
      }
      count++;
    }

    return -1;
  }

  countRight(
    startTime: number,
    endTime: number,
    totalTime: number,
    distance: number
  ): number {
    if (endTime - startTime === 0) {
      return startTime;
    }

    const mid = startTime + Math.ceil((endTime - startTime) / 2);
    if ((totalTime - mid) * mid > distance) {
      return this.countRight(mid, endTime, totalTime, distance);
    }

    let count = mid;
    while (count >= startTime) {
      if ((totalTime - count) * count > distance) {
        return count;
      }
      count--;
    }

    return -1;
  }

  parseInput(data: string[]): { time: number; distance: number } {
    const [_t, timeStr] = data[0].split(':');
    const [_d, distStr] = data[1].split(':');

    return {
      time: Number(timeStr.replace(/ /g, '')),
      distance: Number(distStr.replace(/ /g, '')),
    };
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
