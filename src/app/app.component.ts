import { Component, inject, NgZone, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Let (x0, y0, z0) and (vx0, vy0, vz0) be the position from and velocity with which the rock must be thrown
 * Let (xi, yi, zi) and (vxi, vyi, vzi) be the position and velocity of the ith hailstone, where i ranges from 1 to some `n`
 * hence there exists a time ti for every hailstone where the hailstone and the rock are at exactly the same position
 * hence 
 * x0 + vx0 * ti = xi + vxi * ti ... (1)
 * => (x0 - xi) = - (vx0 - vxi) * ti 
 * => (x0 - xi) / (vx0 - vxi) = -ti ... (2) (Assuming vx0 != vxi)
 * Similarly
 * (y0 - yi) / (vy0 - vyi) = - ti ... (3)
 * (z0 - zi) / (vz0 - vzi) = - ti ... (4)
 * Since the LHSs of (2) and (3) are both ti
 * (x0 - xi) / (vx0 - vxi) = (y0 - yi) /  (vy0 - vyi)
 * (x0 - xi) * (vy0 - vyi) = (y0 - yi) * (vx0 - vxi) 
 * x0 * vy0 - xi * vy0 - x0 * vyi + xi * vyi = y0 * vx0 - yi * vx0 - y0 * vxi + yi * vxi
 * This hold true for any i
 * Let i = 1: x0 * vy0 - x1 * vy0 - x0 * vy1 + x1 * vy1 = y0 * vx0 - y1 * vx0 - y0 * vx1 + y1 * vx1 ... (5)
 * Let i = 2: x0 * vy0 - x2 * vy0 - x0 * vy2 + x2 * vy2 = y0 * vx0 - y2 * vx0 - y0 * vx2 + y2 * vx2 ... (6)
 * Subtract (6) from (5):
 * (-x1 + x2) * vy0 + (-vy1 + vy2) * x0 + (x1 * vy1) - (x2 * vy2)
 *                   = (-y1 + y2) * vx0 + (-vx1 + vx2) * y0 +( y1 * vx1) + (y2 * vx2)
 * Rearranging the terms:
 * (-vy1 + vy2) * x0 - (-vx1 + vx2) * y0 - (-y1 + y2) * vx0 + (-x1 + x2) * vy0 
 *                   = -(x1 * vy1) + (x2 * vy2) +( y1 * vx1) + (y2 * vx2)
 * Where all the coefficients of the position and velocities of the hailstones 1 and 2 are known, so this becomes
 * c1 * x0 + c2 * y0 + c3 * vx0 + c4 * vy0 = c5 where ci is some known constant ... (7)
 * Also, while (7) was obtained using ((1) and (2)), observe that this sort of an equation can be reached even by using ((2) and (4)) or ((3) and (4))
 * c6 * y0 + c7 * z0 + c8 * vy0 + c9 * vz0 = c10 where ci is some known constant
 * c11 * y0 + c12 * z0 + c13 * vy0 + c14 * vz0 = c15 where ci is some known constant
 * Also note that while here hailstones 1 and 2 were chosen, this can be done for any pair of hailstones
 * In (7) there are 4 unknowns, so by taking 4 pairs of hailstones, 4 equations can be obtained
 * These can then be put in a matrix:
 * [Some     ][x0 ] =  [Some other]
 * [matrix   ][y0 ]    [matrix    ]
 * [of       ][vx0]    [of        ]
 * [constants][vy0]    [constants ]
 * Multiplying both sides by the inverse of first matrix gives
 * [x0 ] = Inverse([Some     ]) * [Some other]
 * [y0 ] =         [matrix   ]    [matrix    ]
 * [vx0] =         [of       ]    [of        ]
 * [vy0] =         [constants]    [constants ]
 * This provides 4 out of th e6 unknowns
 * For the other 2 the same process is repeated, but with 2 equations this time with y and z instead of x and y
 * Only 2 equations are needed since the values of y have already been calculated, 
 * but the values of y can be recalculated using 4 equations to sanity check the solution
 * This provides all the unknowns and hence the answer
 */

interface HailstoneModel {
  position: [number, number, number];
  velocity: [number, number, number];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  input = `19, 13, 30 @ -2,  1, -2
18, 19, 22 @ -1, -1, -2
20, 25, 34 @ -2, -2, -4
12, 31, 28 @ -1, -2, -1
20, 19, 15 @  1, -5, -3`;

  result = signal('');
  ngZone = inject(NgZone);

  onSubmit() {
    this.result.set(`...waiting`);

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const data = this.parseRow(this.input);
        const list = data.map((item) => this.parseHailstoneModel(item))
        const total = this.start(list);
        this.result.set(`${total}`);
      }, 0);
    });
  }

  start(data: HailstoneModel[]): number {
    const {positionX, positionY} = this.solveXY(data);
    const {positionZ} = this.solveYZ(data);
    return positionX + positionY + positionZ;
  }

  /**
 * Solves for the initial X, Y positions and VX, VY velocities.
 * @param hailstones - Array of Hailstone objects
 * @returns An object containing the calculated positions and velocities
 */
  solveXY(hailstones: HailstoneModel[]) {
    let count = 0;
    const mainLhs: number[][] = [];
    const mainRhs: number[] = [];

    // 1. Collect 4 valid equations
    for (let i = 0; i < hailstones.length - 1 && count < 4; i++) {
      for (let j = i + 1; j < hailstones.length && count < 4; j++) {
        const [valid, lhs, rhs] = this.getEquation(hailstones[i], hailstones[j], 0, 1);

        if (valid) {
          mainLhs.push(lhs);
          mainRhs.push(rhs);
          count++;
        }
      }
    }

    if (count < 4) {
      throw new Error("Could not find enough independent equations.");
    }

    // 2. Invert the 4x4 matrix using LU Decomposition
    const inverse = this.invertMatrixLU(mainLhs);

    // 3. Multiply Inverse Matrix by RHS Vector (Matrix-Vector Multiplication)
    const answerOfCalcs: number[] = [0, 0, 0, 0];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        answerOfCalcs[row] += inverse[row][col] * mainRhs[col];
      }
    }

    // 4. Map results back to the rock's properties
    return {
      positionX: answerOfCalcs[0],
      positionY: answerOfCalcs[1],
      velocityX: answerOfCalcs[2],
      velocityY: answerOfCalcs[3]
    };
  }

  /**
 * Solves for the initial Y, Z positions and VY, VZ velocities.
 * Note: Indices 1 and 2 correspond to Y and Z.
 */
  solveYZ(hailstones: HailstoneModel[]) {
    let count = 0;
    const mainLhs: number[][] = [];
    const mainRhs: number[] = [];

    // 1. Collect 4 valid equations for indices 1 (Y) and 2 (Z)
    for (let i = 0; i < hailstones.length - 1 && count < 4; i++) {
      for (let j = i + 1; j < hailstones.length && count < 4; j++) {
        // Using idx0 = 1, idx1 = 2
        const [valid, lhs, rhs] = this.getEquation(hailstones[i], hailstones[j], 1, 2);

        if (valid) {
          mainLhs.push(lhs);
          mainRhs.push(rhs);
          count++;
        }
      }
    }

    if (count < 4) {
      throw new Error("Could not find enough independent equations for YZ.");
    }

    // 2. Invert the 4x4 matrix
    const inverse = this.invertMatrixLU(mainLhs);

    // 3. Matrix-Vector Multiplication
    const answerOfCalcs: number[] = [0, 0, 0, 0];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        answerOfCalcs[row] += inverse[row][col] * mainRhs[col];
      }
    }

    /**
     * Results mapping based on the (y,z) system:
     * answerOfCalcs[0] -> Position Y
     * answerOfCalcs[1] -> Position Z
     * answerOfCalcs[2] -> Velocity VY
     * answerOfCalcs[3] -> Velocity VZ
     */
    const positionZ = answerOfCalcs[1];
    const velocityZ = answerOfCalcs[3];

    return { positionZ, velocityZ };
  }

  /**
   * Provides the coefficients of the equation based on two Hailstones.
   * Returns a tuple containing: [success (boolean), coefficients (4 numbers), RHS (number)]
   */
  getEquation(
    hs1: HailstoneModel,
    hs2: HailstoneModel,
    idx0: number,
    idx1: number
  ): [boolean, number[], number] {
    // Check for division by zero or parallel movement conditions as per original logic
    if (hs1.position[idx1] === hs2.position[idx1]) {
      return [false, [], 0];
    }
    if (hs1.velocity[idx1] === hs2.velocity[idx1]) {
      return [false, [], 0];
    }

    const coefficients: number[] = [
      hs2.velocity[idx1] - hs1.velocity[idx1],  // c1
      -(hs2.velocity[idx0] - hs1.velocity[idx0]), // c2
      -(hs2.position[idx1] - hs1.position[idx1]), // c3
      hs2.position[idx0] - hs1.position[idx0],  // c4
    ];

    const rhs: number =
      (hs1.position[idx1] * hs1.velocity[idx0] - hs1.position[idx0] * hs1.velocity[idx1]) -
      (hs2.position[idx1] * hs2.velocity[idx0] - hs2.position[idx0] * hs2.velocity[idx1]);

    return [true, coefficients, rhs];
  }

  /**
   * Inverts a square matrix using LU Decomposition.
   * @param matrix - A 2D array representing a square matrix.
   * @returns The inverted matrix or throws an error if singular.
   */
  invertMatrixLU(matrix: number[][]): number[][] {
    const n = matrix.length;

    // 1. Initialize L and U matrices
    const L: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const U: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    // 2. Perform LU Decomposition (Doolittle Algorithm)
    for (let i = 0; i < n; i++) {
      // Upper Triangular
      for (let k = i; k < n; k++) {
        let sum = 0;
        for (let j = 0; j < i; j++) {
          sum += (L[i][j] * U[j][k]);
        }
        U[i][k] = matrix[i][k] - sum;
      }

      // Lower Triangular
      for (let k = i; k < n; k++) {
        if (i === k) {
          L[i][i] = 1; // Diagonal of L is 1
        } else {
          let sum = 0;
          for (let j = 0; j < i; j++) {
            sum += (L[k][j] * U[j][i]);
          }

          if (U[i][i] === 0) throw new Error("Matrix is singular and cannot be inverted.");
          L[k][i] = (matrix[k][i] - sum) / U[i][i];
        }
      }
    }

    // 3. Solve AX = I where I is identity matrix
    // We solve LY = I (Forward) then UX = Y (Backward)
    const inverse: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      const b = Array(n).fill(0);
      b[i] = 1; // Column of the identity matrix

      // Forward Substitution: L * y = b
      const y = Array(n).fill(0);
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[j][k] * y[k];
        }
        y[j] = b[j] - sum;
      }

      // Backward Substitution: U * x = y
      const x = Array(n).fill(0);
      for (let j = n - 1; j >= 0; j--) {
        let sum = 0;
        for (let k = j + 1; k < n; k++) {
          sum += U[j][k] * x[k];
        }
        x[j] = (y[j] - sum) / U[j][j];
      }

      // Insert result into the column of the inverse matrix
      for (let j = 0; j < n; j++) {
        inverse[j][i] = x[j];
      }
    }

    return inverse;
  }

  parseHailstoneModel(str: string): HailstoneModel {
    const [position, velocity] = str.split('@').map((part) => part.trim());
    const [x, y, z] = position.split(',').map((num) => this.getDigit(num));
    const [vx, vy, vz] = velocity.split(',').map((num) => this.getDigit(num));
    return {
      position: [x, y, z],
      velocity: [vx, vy, vz]
    };
  }

  getDigit(str: string): number {
    return parseInt(str.replace(/^-\D+/g, ''));
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
