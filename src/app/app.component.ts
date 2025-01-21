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
  input = `two1nine
eightwothree
abcone2threexyz
xtwone3four
4nineeightseven2
zoneight234
7pqrstsixteen`;

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
    let first = '',
      last = '',
      total = 0;
    arr.forEach((line) => {
      let count = 0;
      while (count < line.length) {
        const result = this.isDigitStr(line.substring(count));
        if (result) {
          first = first === '' ? result : first;
          last = result;
        } else if (this.isNumeric(line[count])) {
          first = first === '' ? line[count] : first;
          last = line[count];
        }
        count++;
      }
      total += Number(`${first}${last}`);
      first = '';
      last = '';
    });
    return total;
  }

  isNumeric(str: string | undefined): boolean {
    if (str === undefined) return false;
    if (/^\d+$/.test(str)) {
      return true;
    }
    return false;
  }

  isDigitStr(str: string | undefined): string | null {
    const digitStr = [
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
    ];

    if (str === undefined) return null;

    const digit = digitStr.find((s) => str?.startsWith(s));
    if (digit) {
      return this.toNumber(digit);
    }
    return null;
  }

  toNumber(str: string): string {
    switch (str) {
      case 'one':
        return '1';
      case 'two':
        return '2';
      case 'three':
        return '3';
      case 'four':
        return '4';
      case 'five':
        return '5';
      case 'six':
        return '6';
      case 'seven':
        return '7';
      case 'eight':
        return '8';
      case 'nine':
        return '9';
    }
    return '-1';
  }

  getDigitStr(): string[] {
    return [
      'one',
      'two',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'nine',
    ];
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
