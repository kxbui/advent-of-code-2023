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
  input = `Card 1: 41 48 83 86 17 | 83 86  6 31 17  9 48 53
Card 2: 13 32 20 16 61 | 61 30 68 82 17 32 24 19
Card 3:  1 21 53 59 44 | 69 82 63 72 16 21 14  1
Card 4: 41 92 73 84 69 | 59 84 76 51 58  5 54 83
Card 5: 87 83 26 28 32 | 88 30 70 12 93 22 82 36
Card 6: 31 18 13 56 72 | 74 77 10 23 35 67 36 11`;

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
    let total = 0;

    data.forEach((line) => {
      total += this.getCardValue(line);
    });
    return total;
  }

  getCardValue(card: string): number {
    let value = 0;

    const [_, numList] = card.split(':');
    const [winningNums, yourNums] = numList.split('|');

    const result = this.findIntersection(winningNums, yourNums);
    if (result.length) {
      result.forEach((_, i) => {
        value = i > 0 ? value * 2 : 1;
      });
    }
    return value;
  }

  findIntersection(str1: string, str2: string): string[] {
    const array1 = str1.split(/\s*[\s,]\s*/);
    const array2 = str2.split(/\s*[\s,]\s*/);
    return array1.filter((value) => array2.includes(value)).filter(Boolean);
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
