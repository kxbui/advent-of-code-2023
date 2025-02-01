import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const UNKNOWN = '?';
const DAMAGED = '#';
const OPERATIONAL = '.';
const NUM_COPIES = 5;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `???.### 1,1,3
.??..??...?##. 1,1,3
?#?#?#?#?#?#?#? 1,3,1,6
????.#...#... 4,1,1
????.######..#####. 1,6,5
?###???????? 3,2,1`;

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
    const arr = this.parseInput(data);
    const map = new Map<string, number>();
    let total = 0;

    arr.forEach((line) => {
      const spring = Array(NUM_COPIES).fill(line.spring).join(UNKNOWN);
      const groups = Array(NUM_COPIES).fill(line.groups).join(',').split(',');

      total += this.countArrangements(spring, groups, map);
    });

    return total;
  }

  countArrangements(
    spring: string,
    groups: string[],
    map: Map<string, number>
  ): number {
    if (!groups.length) {
      return Number(!spring.includes(DAMAGED));
    }

    if (!spring.length) {
      return 0;
    }

    const firstChar = spring[0];

    switch (firstChar) {
      case OPERATIONAL:
        return this.handleOprChar(spring, groups, map);
      case DAMAGED:
        return this.handleDamagedChar(spring, groups, map);
      case UNKNOWN:
        return (
          this.handleOprChar(spring, groups, map) +
          this.handleDamagedChar(spring, groups, map)
        );
    }
    return 0;
  }

  handleOprChar(
    spring: string,
    groups: string[],
    map: Map<string, number>
  ): number {
    const newSpring = spring.substring(1);
    const mapKey = this.formatMapKey(newSpring, groups);
    if (map.has(mapKey))
      return map.get(mapKey)!;
    const result = this.countArrangements(spring.substring(1), groups, map);
    map.set(mapKey, result);
    return result;
  }

  handleDamagedChar(
    spring: string,
    groups: string[],
    map: Map<string, number>
  ): number {
    const mapKey = this.formatMapKey(spring, groups);
    if (map.has(mapKey))
      return map.get(mapKey)!;

    const firstGroup = Number(groups[0]);
    const damagedNum = this.countChar(
      this.replaceStr(
        spring.substring(0, firstGroup),
        UNKNOWN,
        DAMAGED,
      ),
      DAMAGED
    );

    // If the next group can't fit all the damaged springs, then abort
    if (damagedNum != firstGroup) return 0;

    const nextSpring = spring.substring(firstGroup);

    // If the rest of the record is just the last group
    if (!nextSpring) {
      if (groups.length === 1) {
        map.set(mapKey, 1);
        return 1;
      } else {
        map.set(mapKey, 0);
        return 0;
      }
    }

    // Make sure the character that follows this group is .
    if ([OPERATIONAL].includes(nextSpring[0])) {
      return this.countArrangements(nextSpring, groups.slice(1), map);
    }

    // if the character that follows this group is ? make sure it is .
    if ([UNKNOWN].includes(nextSpring[0])) {
      return this.handleOprChar(
        nextSpring.replace(UNKNOWN, OPERATIONAL),
        groups.slice(1),
        map
      );
    }

    return 0;
  }

  formatMapKey(spring: string, groups: string[]): string {
    return `${spring} ${groups}`;
  }

  countChar(str: string, char: string): number {
    return str.split('').filter((s) => s === char).length;
  }

  replaceStr(
    str: string,
    searchValue: string,
    replaceWith: string
  ): string {
    return str.replaceAll(searchValue, replaceWith);
  }

  parseInput(data: string[]): { spring: string; groups: string }[] {
    const arr: any[] = [];

    data.forEach((line) => {
      const [spring, groups] = line.split(' ');
      arr.push({ spring, groups });
    });

    return arr;
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
