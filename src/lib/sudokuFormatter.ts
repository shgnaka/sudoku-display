export function line81ToPuzzleText(line81: ArrayLike<number>): string {
  if (line81.length !== 81) {
    throw new Error(`line81 length must be 81 (received: ${line81.length})`);
  }

  const rows: string[] = [];

  for (let row = 0; row < 9; row += 1) {
    const tokens: string[] = [];

    for (let col = 0; col < 9; col += 1) {
      const value = line81[row * 9 + col];
      if (!Number.isInteger(value) || value < 0 || value > 9) {
        throw new Error(`Invalid cell value at row=${row}, col=${col}: ${value}`);
      }

      tokens.push(value === 0 ? "." : String(value));
    }

    rows.push(`${tokens.slice(0, 3).join(" ")} | ${tokens.slice(3, 6).join(" ")} | ${tokens.slice(6, 9).join(" ")}`);

    if (row === 2 || row === 5) {
      rows.push("------+-------+------");
    }
  }

  return rows.join("\n");
}
