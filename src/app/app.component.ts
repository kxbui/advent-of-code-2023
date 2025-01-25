import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const FIVE_OF_A_KIND = 6;
const FOUR_OF_A_KIND = 5;
const FULL_HOUSE = 4;
const THREE_OF_A_KIND = 3;
const TWO_PAIR = 2;
const ONE_PAIR = 1;
const HIGH_CARD = 0;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `32T3K 765
T55J5 684
KK677 28
KTJJT 220
QQQJA 483`;

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
    let arr = this.parseInput(data);

    arr = arr.map((item) => ({ ...item, type: this.getType(item.hand) }));

    arr.sort(this.sortTypes);

    return arr.reduce((total, curr, idx) => total + (idx + 1) * curr.bid, 0);
  }

  sortTypes = (
    a: { type: number; hand: string },
    b: { type: number; hand: string }
  ): number => {
    if (a.type < b.type) return -1;
    if (a.type > b.type) return 1;

    let count = 0;
    while (count < a.hand.length) {
      const val = this.compareCard(a.hand[count], b.hand[count]);
      if (val) return val;
      count++;
    }
    return 0;
  };

  compareCard(card1: string, card2: string): number {
    const arr = [
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'T',
      'J',
      'Q',
      'K',
      'A',
    ];

    const idx1 = arr.findIndex((str) => card1 === str);
    const idx2 = arr.findIndex((str) => card2 === str);

    return idx1 - idx2;
  }

  getType(hand: string): number {
    const arr = this.groupTypes(hand);

    if (this.isFiveOfAKind(arr)) return FIVE_OF_A_KIND;
    else if (this.isFourOfAKind(arr)) return FOUR_OF_A_KIND;
    else if (this.isFullHouse(arr)) return FULL_HOUSE;
    else if (this.isThreeOfAKind(arr)) return THREE_OF_A_KIND;
    else if (this.isTwoPair(arr)) return TWO_PAIR;
    else if (this.isOnePair(arr)) return ONE_PAIR;
    else if (this.isHighCard(arr)) return HIGH_CARD;
    return -1;
  }

  isFiveOfAKind(arr: any[]) {
    return arr.length === 1;
  }

  isFourOfAKind(arr: any[]) {
    return arr.length === 2 && arr[0].length === 1 && arr[1].length === 4;
  }

  isFullHouse(arr: any[]) {
    return arr.length === 2 && arr[0].length === 2 && arr[1].length === 3;
  }

  isThreeOfAKind(arr: any[]) {
    return (
      arr.length === 3 &&
      arr[0].length === 1 &&
      arr[1].length === 1 &&
      arr[2].length === 3
    );
  }

  isTwoPair(arr: any[]) {
    return (
      arr.length === 3 &&
      arr[0].length === 1 &&
      arr[1].length === 2 &&
      arr[2].length === 2
    );
  }

  isOnePair(arr: any[]) {
    return (
      arr.length === 4 &&
      arr[0].length === 1 &&
      arr[1].length === 1 &&
      arr[2].length === 1 &&
      arr[3].length === 2
    );
  }

  isHighCard(arr: any[]) {
    return arr.length === 5;
  }

  groupTypes(hand: string): any[] {
    let count = 0,
      str = '';
    const arr: any[] = [];
    const sortedArr = hand.split('').sort();
    while (count <= sortedArr.length) {
      if (count === sortedArr.length) {
        arr.push(str);
      } else if (count !== 0 && sortedArr[count] != sortedArr[count - 1]) {
        arr.push(str);
        str = sortedArr[count];
      } else {
        str += sortedArr[count];
      }
      count++;
    }
    arr.sort((a, b) => a.length - b.length);
    return arr;
  }

  parseInput(data: string[]): any[] {
    const arr: any[] = [];
    data.forEach((line) => {
      const [hand, bid] = line.split(/\s*[\s,]\s*/);
      arr.push({ hand, bid });
    });
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
