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
  input = `px{a<2006:qkq,m>2090:A,rfg}
pv{a>1716:R,A}
lnx{m>1548:A,A}
rfg{s<537:gd,x>2440:R,A}
qs{s>3448:A,lnx}
qkq{x<1416:A,crn}
crn{x>2662:A,R}
in{s<1351:px,qqz}
qqz{s>2770:qs,m<1801:hdj,R}
gd{a>3333:R,R}
hdj{m>838:A,pv}

{x=787,m=2655,a=1222,s=2876}
{x=1679,m=44,a=2067,s=496}
{x=2036,m=264,a=79,s=2244}
{x=2461,m=1339,a=466,s=291}
{x=2127,m=1623,a=2188,s=1013}`;

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
    const { workflows } = this.parseInput(data);
    const ratings = new Map([
      ['x', '1-4000'],
      ['m', '1-4000'],
      ['a', '1-4000'],
      ['s', '1-4000'],
    ]);
    return this.findAcceptableWorkflows(workflows, ratings, 'in');
  }

  findAcceptableWorkflows(
    workflows: Map<string, any[]>,
    ratings: Map<string, string>,
    startWorkflow: string
  ): number {
    if (['A'].includes(startWorkflow)) {
      return this.countDistinctRatings(ratings);
    }

    if (['R'].includes(startWorkflow)) {
      return 0;
    }

    let prevRatings = ratings;
    const arr = [];
    const rules = workflows.get(startWorkflow);
    if (rules?.length) {
      let count = 0;
      while (count < rules.length) {
        const rule = rules[count];
        if (rule.includes(':')) {
          const [part, destination] = rule.split(':');
          const { truthy, notTruthy } = this.splitRange(part);

          const ratingA = new Map(prevRatings).set(
            part[0],
            this.mergeRange(prevRatings.get(part[0])!, truthy)
          );
          prevRatings = new Map(prevRatings).set(
            part[0],
            this.mergeRange(prevRatings.get(part[0])!, notTruthy)
          );

          arr.push(
            this.findAcceptableWorkflows(workflows, ratingA, destination)
          );
        }
        count++;
      }
    }
    arr.push(
      this.findAcceptableWorkflows(workflows, prevRatings, rules?.at(-1))
    );
    return arr.reduce((total, curr) => total + curr, 0);
  }

  mergeRange(oldRange: string, newRange: string): string {
    const [start1, end1] = oldRange.split('-');
    const [start2, end2] = newRange.split('-');

    return `${Math.max(Number(start1), Number(start2))}-
    ${Math.min(Number(end1), Number(end2))}`;
  }

  countDistinctRatings(ratings: Map<string, string>): number {
    return Array.from(ratings.values()).reduce((total, curr) => {
      const [a, b] = curr.split('-');
      return total * (Number(b) - Number(a) + 1);
    }, 1);
  }

  splitRange(rule: string): { truthy: string; notTruthy: string } {
    const oper = rule[1];
    const num = rule.substring(2);

    if (oper === '<') {
      return {
        truthy: `1-${Number(num) - 1}`,
        notTruthy: `${Number(num)}-4000`,
      };
    }
    return {
      truthy: `${Number(num) + 1}-4000`,
      notTruthy: `1-${Number(num)}`,
    };
  }

  compare(a: string, b: string, operator: string): boolean {
    switch (operator) {
      case '<':
        return Number(a) < Number(b);
      case '>':
        return Number(a) > Number(b);
    }
    return false;
  }

  parseInput(data: string[]) {
    const workflows = new Map<string, any[]>();
    let count = 0;

    while (data[count].trim()) {
      const workflow = data[count];
      const [name] = workflow.split('{');
      const rules = this.extractValueFromBraces(workflow).split(',');
      workflows.set(name, rules);
      count++;
    }

    return { workflows };
  }

  extractValueFromBraces(str: string): string {
    return str.match(/\{(.*?)\}/)?.[1] ?? str;
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
