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
  input = `1abc2
pqr3stu8vwx
a1b2c3d4e5f
treb7uchet`;

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
      for (let i = 0; i < line.length; i++) {
        if (this.isNumeric(line.at(i))) {
          first = first === '' ? line.at(i)! : first;
          last = line.at(i)!;
        }
      }
      total += Number(`${first}${last}`);
      first = '';
      last = ''
    });
    return total;
  }

  isNumeric(str: string | undefined): boolean {
    return str ? /^\d+$/.test(str) : false;
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
