import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const LEFT = 'L';
const RIGHT = 'R';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `LLR

AAA = (BBB, BBB)
BBB = (AAA, ZZZ)
ZZZ = (ZZZ, ZZZ)`;

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
    const { seq, network } = this.parseInput(data);
    return this.lookup(seq, network);
  }

  lookup(seq: string, network: Map<string, any>): number {
    let count = 0;
    let start = 'AAA';
    while (true) {
      let i = 0;
      while (i < seq.length) {
        const val = network.get(start);
        start = seq[i] === LEFT ? val.left : val.right;
        count++;
        if (start === 'ZZZ') return count;
        i++;
      }
    }
  }

  parseInput(data: string[]) {
    const seq = data[0];

    let count = 2;
    const network = new Map();
    while (count < data.length) {
      const [node, neighbors] = data[count].split(' = ');
      const [left, right] = neighbors.split(',');
      network.set(node, {
        left: left.replace(/[()]/g, '').trim(),
        right: right.replace(/[()]/g, '').trim(),
      });
      count++;
    }

    return { seq, network };
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
