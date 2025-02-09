import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const BTN_PUSH_NUM = 1000;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
//   input = `broadcaster -> a
// %a -> inv, con
// &inv -> b
// %b -> con
// &con -> output`;

  input = `broadcaster -> a, b, c
%a -> b
%b -> c
%c -> inv
&inv -> a`;

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
    let totalHigh = 0,
      totalLow = 0;
    const { configs, ffSet, conjSet } = this.parseInput(data);
    const ffMap = this.initFFMap(ffSet);
    const conjMap = this.initConjMap(configs, conjSet);

    Array(BTN_PUSH_NUM)
      .fill('')
      .forEach(() => {
        const { high, low } = this.runSeq(configs, ffMap, conjMap);
        totalHigh += high;
        totalLow += low;
      });
    return totalHigh * totalLow;
  }

  runSeq(
    configs: Map<string, string[]>,
    ffMap: Map<string, string>,
    conjMap: Map<string, Map<string, string>>
  ) {
    let high = 0,
      low = 1;
    const queue = [];
    queue.push('broadcaster-L');

    while (queue.length) {
      const config = queue.shift();
      if (config) {
        const [module, pulse] = config.split('-');
        const destinations = configs.get(module);
        if (destinations?.length) {
          destinations.forEach((dest) => {
            if (ffMap.has(dest)) {
              const newPulse = this.handleFF(pulse, ffMap.get(dest)!);
              if (newPulse) {
                ffMap.set(dest, newPulse);
                queue.push(`${dest}-${newPulse}`);
              }
            } else if (conjMap.has(dest)) {
              const newMap = this.handleConj(
                conjMap.get(dest)!,
                module,
                pulse
              )!;
              conjMap.set(dest, newMap);
              const newPulse = Array.from(newMap.values()).every(
                (item) => item === 'H'
              )
                ? 'L'
                : 'H';
              queue.push(`${dest}-${newPulse}`);
            }
            pulse === 'L' && low++;
            pulse === 'H' && high++;
          });
        }
      }
    }
    return { low, high };
  }

  initFFMap(ffSet: Set<string>) {
    return new Map(Array.from(ffSet.values()).map((key) => [key, 'L']));
  }

  initConjMap(
    configs: Map<string, string[]>,
    conjSet: Set<string>
  ) {
    const map = new Map<string, Map<string, string>>();
    Array.from(configs.entries())
      .forEach(([input, arr]) => {
        arr.forEach((item) => {
          if (conjSet.has(item)) {
            map.has(item)
              ? map.set(item, new Map([...map.get(item)!, [input, 'L']]))
              : map.set(item, new Map([[input, 'L']]));
          }
        });
      });

    return map;
  }

  handleFF(pulse: string, prev: string): string | null {
    if (pulse === 'L') {
      return prev === 'L' ? 'H' : 'L';
    }
    return null;
  }

  handleConj(
    map: Map<string, string>,
    module: string,
    pulse: string
  ): Map<string, string> {
    const newMap = new Map(map);
    newMap.set(module, pulse);
    return newMap;
  }

  parseInput(data: string[]): {
    configs: Map<string, string[]>;
    ffSet: Set<string>;
    conjSet: Set<string>;
  } {
    const configs = new Map<string, string[]>();
    const ffSet = new Set<string>();
    const conjSet = new Set<string>();

    data.forEach((line) => {
      const idx1 = line.indexOf('-');
      const idx2 = line.indexOf('>');
      const module = line
        .substring(
          ['%', '&'].some((char) => line.startsWith(char)) ? 1 : 0,
          idx1
        )
        .trim();
      configs.set(
        module,
        line
          .substring(idx2 + 1)
          .split(',')
          .map((str) => str.trim())
      );
      line.startsWith('%') && ffSet.add(module);
      line.startsWith('&') && conjSet.add(module);
    });

    return { configs, ffSet, conjSet };
  }

  formatLoc(currPos: { row: number; col: number; direction: string }) {
    return [currPos.row, currPos.col, currPos.direction]
      .filter((str) => str !== undefined)
      .join('-');
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
