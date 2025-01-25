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

    arr = arr.map((item) => ({
      ...item,
      type: this.getTypeWithWildcards(item.hand),
    }));

    arr.sort(this.sortTypes);

    return arr.reduce((total, curr, idx) => total + (idx + 1) * curr.bid, 0);
  }

  sortTypes = (
    a: { type: number; hand: string },
    b: { type: number; hand: string }
  ): number => {
    if (a.type < b.type) return -1;
    if (a.type > b.type) return 1;

    return this.compareTwoCards(a, b);
  };

  compareTwoCards = (
    a: { type: number; hand: string },
    b: { type: number; hand: string }
  ): number => {
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
      'J',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'T',
      'Q',
      'K',
      'A',
    ];

    const idx1 = arr.findIndex((str) => card1 === str);
    const idx2 = arr.findIndex((str) => card2 === str);

    return idx1 - idx2;
  }

  getTypeWithWildcards(hand: string): number {
    const orgType = this.getType(hand);

    let newHand = '';
    const arr = this.groupTypes(hand);
    if (hand.includes('J') && orgType < FIVE_OF_A_KIND) {
      if (orgType === FOUR_OF_A_KIND)
        newHand = this.handleFourOfAKindWildcards(arr);
      else if (orgType === FULL_HOUSE)
        newHand = this.handleFullHouseWildcards(arr);
      else if (orgType === THREE_OF_A_KIND)
        newHand = this.handleThreeOfAKindWildcards(arr);
      else if (orgType === TWO_PAIR) newHand = this.handleTwoPairWildcards(arr);
      else if (orgType === ONE_PAIR) newHand = this.handleOnePairWildcards(arr);
      else if (orgType === HIGH_CARD)
        newHand = this.handleHighCardWildcards(arr);
      
      return this.getType(newHand);
    }
    return orgType;
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

  handleFourOfAKindWildcards(arr: any[]): string {
    if (arr[0].includes('J')) {
      return [arr[0].replaceAll('J', arr[1][0]), arr[1]].join('');
    }
    return [arr[0], arr[1].replaceAll('J', arr[0])].join('');
  }

  handleFullHouseWildcards(arr: any[]): string {
    if (arr[0].includes('J')) {
      return [arr[0].replaceAll('J', arr[1][0]), arr[1]].join('');
    }
    return [arr[0], arr[1].replaceAll('J', arr[0])].join('');
  }

  handleThreeOfAKindWildcards(arr: any[]): string {
    if (arr[0].includes('J')) {
      return [arr[0].replaceAll('J', arr[2][0]), arr[1], arr[2]].join('');
    } else if (arr[1].includes('J')) {
      return [arr[1].replaceAll('J', arr[2][0]), arr[0], arr[2]].join('');
    }
    return [arr[2].replaceAll('J', arr[1]), arr[0], arr[1]].join('');
  }

  handleTwoPairWildcards(arr: any[]): string {
    if (arr[0].includes('J')) {
      return [arr[0].replaceAll('J', arr[2][0]), arr[1], arr[2]].join('');
    } else if (arr[1].includes('J')) {
      return [arr[1].replaceAll('J', arr[2][0]), arr[0], arr[2]].join('');
    }
    return [arr[2].replaceAll('J', arr[1][0]), arr[0], arr[1]].join('');
  }

  handleOnePairWildcards(arr: any[]): string {
    if (arr[0].includes('J')) {
      return [arr[0].replaceAll('J', arr[3][0]), arr[1], arr[2], arr[3]].join(
        ''
      );
    } else if (arr[1].includes('J')) {
      return [arr[1].replaceAll('J', arr[3][0]), arr[0], arr[2], arr[3]].join(
        ''
      );
    } else if (arr[2].includes('J')) {
      return [arr[2].replaceAll('J', arr[3][0]), arr[0], arr[1], arr[3]].join(
        ''
      );
    }
    return [arr[3].replaceAll('J', arr[2]), arr[0], arr[1], arr[2]].join('');
  }

  handleHighCardWildcards(arr: any[]): string {
    const temp = [...arr];
    const idx = arr.findIndex((str) => str.includes('J'));
    temp[idx] = idx - 1 < 0 ? temp[idx + 1] : temp[idx - 1];
    return temp.join('');
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
