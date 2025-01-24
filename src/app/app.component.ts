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
    const arr = this.parseInput(data);
    let total = 1;

    arr.forEach((item) => {
      total *= this.countOptions(item);
    });
    return total;
  }

  countOptions(race: { time: number; distance: number }): number {
    let count = 0;

    for (let i = 0; i <= race.time; i++) {
      const dist = (race.time - i) * i;
      if (dist > race.distance) count++;
    }

    return count;
  }

  parseInput(data: string[]): { time: number; distance: number }[] {
    const [_t, timeStr] = data[0].split(':');
    const timeArr = timeStr
      .trim()
      .split(/\s*[\s,]\s*/)
      .map((str) => this.getDigit(str));

    const [_d, distStr] = data[1].split(':');
    const distanceArr = distStr
      .trim()
      .split(/\s*[\s,]\s*/)
      .map((str) => this.getDigit(str));

    return timeArr.map((time, i) => ({ time, distance: distanceArr[i] }));
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
