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
  input = `seeds: 79 14 55 13

seed-to-soil map:
50 98 2
52 50 48

soil-to-fertilizer map:
0 15 37
37 52 2
39 0 15

fertilizer-to-water map:
49 53 8
0 11 42
42 0 7
57 7 4

water-to-light map:
88 18 7
18 25 70

light-to-temperature map:
45 77 23
81 45 19
68 64 13

temperature-to-humidity map:
0 69 1
1 0 69

humidity-to-location map:
60 56 37
56 93 4`;

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
    let min = Infinity;
    let dest = -1;

    const { seeds, maps } = this.parseInput(data);

    seeds.forEach((seed) => {
      dest = seed;
      maps.forEach((map) => {
        dest = this.mapValue(map, dest);
      });
      if (min > dest) min = dest;
    });
    return min;
  }

  mapValue(map: any[], source: number): number {
    const section = map.find(
      (sec) => source >= sec.sourceStart && source <= sec.sourceEnd
    );
    if (section) {
      const gap = source - section.sourceStart;
      return section.destStart + gap;
    }
    return source
  }

  parseInput(input: string[]): { seeds: any[]; maps: any[] } {
    const seeds = this.parseSeeds(input[0]);

    const maps = this.parseConversion(input.slice(2));

    return { seeds, maps };
  }

  parseConversion(data: string[]): any[] {
    let arr: any[] = [],
      maps: any[] = [];
    let count = 0;

    while (count <= data.length) {
      const line = data[count];
      if (line && line.trim()) {
        if (!Number.isNaN(this.getDigit(line))) {
          const [dest, source, range] = line.split(/\s*[\s,]\s*/);
          arr.push({
            sourceStart: Number(source),
            sourceEnd: Number(source) + Number(range),
            destStart: Number(dest),
            destEnd: Number(dest) + Number(range),
          });
        }
      } else {
        maps.push(arr);
        arr = [];
      }
      count++;
    }
    return maps;
  }

  parseSeeds(line: string): any[] {
    const [_, seeds] = line.split(':');
    return seeds
      .trim()
      .split(/\s*[\s,]\s*/)
      .map((str) => this.getDigit(str));
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
