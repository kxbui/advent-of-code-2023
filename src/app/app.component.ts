import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const OUTPUT = 'rx';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `broadcaster -> a
%a -> inv, con
&inv -> b
%b -> con
&con -> se
&se -> me
&me -> rx`;

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

  /**
   *
   */
  start(data: string[]): number {
    const { configs, ffSet, conjSet } = this.parseInput(data);
    const orgFFMap = this.initFFMap(ffSet);
    const orgConjMap = this.initConjMap(configs, conjSet);

    return this.countLoop(configs, orgFFMap, orgConjMap);
  }

  /**
   * Iterate over the four children of the broadcaster,
   * remove the other three and any state that can no longer be reached
   * and then run until rx changes
   */
  countLoop(
    orgConfigs: Map<string, string[]>,
    orgFFMap: Map<string, string>,
    orgConjMap: Map<string, Map<string, string>>
  ): number {
    const arr: number[] = [];

    const [module] = Array.from(orgConfigs.entries()).find(([_, arr]) =>
      arr.includes(OUTPUT)
    )!;
    const inputs = Array.from(orgConjMap.get(module)!.entries())
      .map(([module]) => Array.from(orgConjMap.get(module)!.keys())[0])
      .map((key) => key);

    inputs.forEach((input) => {
      const items = Array.from(orgConjMap.get(input)!.keys()).map((key) => key);
      const list: number[] = [];

      items.forEach((item) => {
        const configs = new Map(orgConfigs);
        const ffMap = new Map(orgFFMap);
        const conjMap = new Map(orgConjMap);

        let count = 1,
          changeCount = 0,
          cycles: number[] = [],
          curr = '';

        while (changeCount < 3) {
          this.runSeq(configs, ffMap, conjMap);
          const modules = Array.from(conjMap.get(input)!.entries()).filter(
            ([key]) => key === item
          );

          if (modules.length) {
            modules.forEach(([module, value]) => {
              if (curr != value) {
                cycles.push(count);
                curr = value;
                changeCount++;
              }
            });
          }
          count++;
        }

        list.push(cycles[cycles.length - 1]);
      });
      arr.push(Math.max(...list));
    });

    return this.findLcm(arr);
  }

  runSeq(
    configs: Map<string, string[]>,
    ffMap: Map<string, string>,
    conjMap: Map<string, Map<string, string>>
  ): string {
    let finalPulse = '';
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
            } else {
              finalPulse = pulse;
            }
          });
        }
      }
    }
    return finalPulse;
  }

  initFFMap(ffSet: Set<string>) {
    return new Map(Array.from(ffSet.values()).map((key) => [key, 'L']));
  }

  initConjMap(configs: Map<string, string[]>, conjSet: Set<string>) {
    const map = new Map<string, Map<string, string>>();
    Array.from(configs.entries()).forEach(([input, arr]) => {
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
