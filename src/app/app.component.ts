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

    const { seeds, maps } = this.parseInput(data);

    seeds.forEach((seed) => {
      const localMin = this.mapCategories(maps, seed);
      if (localMin < min) {
        min = localMin;
      }
    });
    return min;
  }

  mapCategories(maps: any[][], seed: { start: number; end: number }): number {
    let queue: any[] = [];
    queue.push(seed);

    maps.forEach((map) => {
      queue = this.mapCategory(map, queue);
    });

    let min = Infinity;
    queue.forEach((sec) => {
      if (sec.start < min) min = sec.start;
    });
    return min;
  }

  mapCategory(map: any[], arr: { start: number; end: number }[]): any[] {
    let queue: any[] = [],
      temp: any[] = [...arr];

    while (temp.length) {
      const s = temp.shift();
      const section = map.find(
        (sec) => s.start >= sec.sourceStart && s.start < sec.sourceEnd
      );
      if (section) {
        if (s.end <= section.sourceEnd) {
          queue.push({
            start: this.mapValue(section, s.start),
            end: this.mapValue(section, s.end),
          });
        } else {
          queue.push({
            start: this.mapValue(section, s.start),
            end: this.mapValue(section, section.sourceEnd),
          });
          temp.push({
            start: section.sourceEnd,
            end: s.end,
          });
        }
      } else {
        queue.push({
          start: s.start,
          end: s.end,
        });
      }
    }
    return queue;
  }

  mapValue(
    section: { sourceStart: number; sourceEnd: number; destStart: number },
    source: number
  ): number {
    const gap = source - section.sourceStart;
    return section.destStart + gap;
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
    const sets = seeds
      .trim()
      .split(/\s*[\s,]\s*/)
      .map((str) => this.getDigit(str));

    const arr: any[] = [];
    for (let i = 0; i < sets.length - 1; i += 2) {
      arr.push({
        start: sets[i],
        end: sets[i] + sets[i + 1],
      });
    }
    return arr;
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
