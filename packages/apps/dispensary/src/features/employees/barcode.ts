// Code 128 subset B. Widths alternate bar, space, starting with a bar. Stop is 7 digits.
const PATTERNS = [
  "212222",
  "222122",
  "222221",
  "121223",
  "121322",
  "131222",
  "122213",
  "122312",
  "132212",
  "221213",
  "221312",
  "231212",
  "112232",
  "122132",
  "122231",
  "113222",
  "123122",
  "123221",
  "223211",
  "221132",
  "221231",
  "213212",
  "223112",
  "312131",
  "311222",
  "321122",
  "321221",
  "312212",
  "322112",
  "322211",
  "212123",
  "212321",
  "232121",
  "111323",
  "131123",
  "131321",
  "112313",
  "132113",
  "132311",
  "211313",
  "231113",
  "231311",
  "112133",
  "112331",
  "132131",
  "113123",
  "113321",
  "133121",
  "313121",
  "211331",
  "231131",
  "213113",
  "213311",
  "213131",
  "311123",
  "311321",
  "331121",
  "312113",
  "312311",
  "332111",
  "314111",
  "221411",
  "431111",
  "111224",
  "111422",
  "121124",
  "121421",
  "141122",
  "141221",
  "112214",
  "112412",
  "122114",
  "122411",
  "142112",
  "142211",
  "241211",
  "221114",
  "413111",
  "241112",
  "134111",
  "111242",
  "121142",
  "121241",
  "114212",
  "124112",
  "124211",
  "411212",
  "421112",
  "421211",
  "212141",
  "214121",
  "412121",
  "111143",
  "111341",
  "131141",
  "114113",
  "114311",
  "411113",
  "411311",
  "113141",
  "114131",
  "311141",
  "411131",
  "211412",
  "211214",
  "211232",
  "2331112",
];

function symbols(text: string): number[] {
  const values = [104];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code > 126) throw new Error("Code 128B cannot encode " + ch);
    values.push(code - 32);
  }
  let sum = values[0];
  for (let index = 1; index < values.length; index++) sum += values[index] * index;
  values.push(sum % 103, 106);
  return values;
}

/** Bar and space modules. 1 is a bar. Quiet zones are not included. */
export function code128Bits(text: string): string {
  let bits = "";
  for (const value of symbols(text)) {
    let black = true;
    for (const width of PATTERNS[value]) {
      bits += (black ? "1" : "0").repeat(Number(width));
      black = !black;
    }
  }
  return bits;
}

export function code128Bars(text: string): { x: number; width: number; total: number }[] {
  const bits = `${"0".repeat(10)}${code128Bits(text)}${"0".repeat(10)}`;
  const bars: { x: number; width: number; total: number }[] = [];
  let index = 0;
  while (index < bits.length) {
    if (bits[index] === "0") {
      index += 1;
      continue;
    }
    const x = index;
    while (index < bits.length && bits[index] === "1") index += 1;
    bars.push({ x, width: index - x, total: bits.length });
  }
  return bars;
}
