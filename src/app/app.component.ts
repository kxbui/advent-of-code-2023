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
  input = `rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7`;

  result = signal('');
  ngZone = inject(NgZone);

  onSubmit() {
    this.result.set(`...waiting`);

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const data = this.input.split(',');
        const total = this.start(data);
        this.result.set(`${total}`);
      }, 0);
    });
  }

  start(data: string[]): number {
    let map = new Map<number, any[]>();

    data.forEach((step) => {
      map = this.buildLenConfig(map, step);
    });

    return this.calcFocusingPower(map);
  }

  buildLenConfig(map: Map<number, any[]>, data: string): Map<number, any[]> {
    if (data.includes('=')) {
      const [label, focalLength] = data.split('=');
      return this.addLen(map, label, Number(focalLength));
    }
    const [label] = data.split('-');
    return this.removeLen(map, label);
  }

  calcFocusingPower(map: Map<number, any[]>): number {
    return Array.from(map.entries()).reduce((total, [box, lens]) => {
      return (
        total +
        lens.reduce((sum, { focalLength }, i) => {
          return sum + (box + 1) * (i + 1) * focalLength;
        }, 0)
      );
    }, 0);
  }

  addLen(
    map: Map<number, any[]>,
    label: string,
    focalLength: number
  ): Map<number, any[]> {
    const boxNum = this.runHASH(label, 0);
    if (!map.has(boxNum)) {
      map.set(boxNum, [{ label, focalLength }]);
      return map;
    }
    const lens = map.get(boxNum);
    if (lens) {
      const idx = lens.findIndex((len) => len.label === label);
      if (idx >= 0) {
        const arr = lens.map((len, i) =>
          i === idx ? { ...len, focalLength } : len
        );
        map.set(boxNum, arr);
      } else {
        map.set(boxNum, [...lens, { label, focalLength }]);
      }
    }
    return map;
  }

  removeLen(map: Map<number, any[]>, label: string): Map<number, any[]> {
    const boxNum = this.runHASH(label, 0);
    if (!map.has(boxNum)) {
      return map;
    }
    const lens = map.get(boxNum);
    if (lens) {
      const arr = lens.filter((len) => len.label !== label);
      map.set(boxNum, arr);
    }
    return map;
  }

  runHASH(str: string, total: number): number {
    if (!str.trim()) return total;

    const char = str.at(0);
    let value = total;

    value += this.getASCII(char!);
    value *= 17;
    value = value % 256;

    return this.runHASH(str.substring(1), value);
  }

  getASCII(str: string): number {
    return str.charCodeAt(0);
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
