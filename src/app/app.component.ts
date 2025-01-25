import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const LEFT = 'L';
const RIGHT = 'R';

// 21838660345787142275147567 high
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `LR

11A = (11B, XXX)
11B = (XXX, 11Z)
11Z = (11B, XXX)
22A = (22B, XXX)
22B = (22C, 22C)
22C = (22Z, 22Z)
22Z = (22B, 22B)
XXX = (XXX, XXX)`;

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
    return this.lookupMultiple(seq, network);
  }

  lookupMultiple(seq: string, network: Map<string, any>): number {
    let startNodes: string[] = Array.from(network.keys()).filter((key) =>
      key.endsWith('A')
    );
    const arr = startNodes.map((node) => this.lookup(seq, network, node));
    return this.findLcm(arr);
  }

  lookup(seq: string, network: Map<string, any>, startNode: string): number {
    let count = 0;
    let start = startNode;
    while (true) {
      let i = 0;
      while (i < seq.length) {
        const val = network.get(start);
        start = seq[i] === LEFT ? val.left : val.right;
        count++;
        if (start.endsWith('Z')) {
          return count;
        }
        i++;
      }
    }
  }

  findLcm(arr: number[]) {
    let result = arr[0];
    for (let i = 1; i < arr.length; i++) {
      result = this.lcm(result, arr[i]);
    }
    return result;
  }

  lcm(a: number, b: number) {
    return Math.abs(a * b) / this.gcd(a, b);
  }

  gcd(a: number, b: number): number {
    if (b === 0) {
      return a;
    }
    return this.gcd(b, a % b);
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
