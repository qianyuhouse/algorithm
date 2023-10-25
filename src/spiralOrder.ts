// 54. 螺旋矩阵
// 给你一个 m 行 n 列的矩阵 matrix ，请按照 顺时针螺旋顺序 ，返回矩阵中的所有元素。
export function spiralOrder(matrix: number[][]): number[] {
  const result: number[] = [];
  let n = matrix.length;
  let m = matrix[0] ? matrix[0].length : 0;
  let top = 0;
  let right = m - 1;
  let bottom = n - 1;
  let left = 0;

  //   [1, 2, 3, 4],
  //   [5, 6, 7, 8],
  //   [9, 10, 11, 12],
  const count = m * n;
  while (result.length < count) {
    for (let i = left; i <= right; i++) {
      result.push(matrix[top][i]);
    }
    top++;
    if (result.length === count) break;
    for (let i = top; i <= bottom; i++) {
      result.push(matrix[i][right]);
    }
    right--;
    if (result.length === count) break;
    for (let i = right; i >= left; i--) {
      result.push(matrix[bottom][i]);
    }
    bottom--;
    if (result.length === count) break;
    for (let i = bottom; i >= top; i--) {
      result.push(matrix[i][left]);
    }
    left++;
  }

  return result;
}
