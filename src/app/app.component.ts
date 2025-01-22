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
  input = `Game 1: 3 blue, 4 red; 1 red, 2 green, 6 blue; 2 green
Game 2: 1 blue, 2 green; 3 green, 4 blue, 1 red; 1 green, 1 blue
Game 3: 8 green, 6 blue, 20 red; 5 blue, 4 red, 13 green; 5 green, 1 red
Game 4: 1 green, 3 red, 6 blue; 3 green, 6 red; 3 green, 15 blue, 14 red
Game 5: 6 red, 1 blue, 3 green; 2 blue, 1 red, 2 green`;

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

  start(arr: string[]): number {
    let total = 0;
    arr.forEach((line) => {
      const [_, sets] = line.split(':');
      total += this.getMinCubes(sets);
    });
    return total;
  }

  getMinCubes(sets: string): number {
    let b = 0,
    r = 0,
    g = 0;

    sets.split(';').forEach((set) => {
      set.split(',').forEach((cube) => {
        const blue = cube.includes('blue') ? this.getDigit(cube) : null;
        const red = cube.includes('red') ? this.getDigit(cube) : null;
        const green = cube.includes('green') ? this.getDigit(cube) : null;

        b = blue !== null && blue > b ? blue : b;
        r = red !== null && red > r ? red : r;
        g = green !== null && green > g ? green : g;
      });
    }, 0);

    return (b ?? 1) * (r ?? 1) * (g ?? 1);
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
