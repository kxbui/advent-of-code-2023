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
    const { workflows, ratings } = this.parseInput(data);
    let total = 0;

    ratings.forEach((rating) => {
      const result = this.runWorkflow(workflows, rating, 'in');
      total += result === 'A' ? this.countRatingNumbers(rating) : 0;
    });
    return total;
  }

  countRatingNumbers(rating: Map<string, string>): number {
    return Array.from(rating.values()).reduce(
      (total, curr) => total + Number(curr),
      0
    );
  }

  runWorkflow(
    workflows: Map<string, any[]>,
    rating: Map<string, string>,
    startWorkflow: string
  ): string {
    if (['A', 'R'].includes(startWorkflow)) {
      return startWorkflow;
    }

    const rules = workflows.get(startWorkflow);
    if (rules?.length) {
      let count = 0;
      while (count < rules.length) {
        const rule = rules[count];
        if (rule.includes(':')) {
          const [part, destination] = rule.split(':');
          const result = this.compare(
            rating.get(part[0])!,
            part.substring(2),
            part[1]
          );
          if (result) {
            return this.runWorkflow(workflows, rating, destination);
          }
        }
        count++;
      }
    }
    return this.runWorkflow(workflows, rating, rules?.at(-1));
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

    count++;
    const ratings: any[] = [];
    data.slice(count).forEach((item) => {
      const [x, m, a, s] = this.extractValueFromBraces(item).split(',');
      ratings.push(
        new Map([
          ['x', x.split('=')[1]],
          ['m', m.split('=')[1]],
          ['a', a.split('=')[1]],
          ['s', s.split('=')[1]],
        ])
      );
    });

    return { workflows, ratings };
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
