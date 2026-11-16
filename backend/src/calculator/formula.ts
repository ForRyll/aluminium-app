export function evalFormula(expr: string, vars: Record<string, number>): number {
  const tokens = expr.match(/\d+(?:\.\d+)?|[A-Za-z_]\w*|\S/g) ?? [];
  let pos = 0;
  const fail = (m: string): never => {
    throw new Error(`Rumus "${expr}" tidak valid: ${m}`);
  };

  function sum(): number {
    let v = product();
    while (tokens[pos] === '+' || tokens[pos] === '-') {
      const op = tokens[pos++];
      const r = product();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  function product(): number {
    let v = factor();
    while (tokens[pos] === '*' || tokens[pos] === '/') {
      const op = tokens[pos++];
      const r = factor();
      if (op === '/' && r === 0) fail('dibagi nol');
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }

  function factor(): number {
    const t = tokens[pos++];
    if (t === undefined) return fail('rumus terpotong');
    if (t === '-') return -factor();
    if (t === '(') {
      const v = sum();
      if (tokens[pos++] !== ')') fail('kurung tidak tertutup');
      return v;
    }
    if (/^\d/.test(t)) return Number(t);
    if (/^[A-Za-z_]/.test(t)) {
      if (!(t in vars)) fail(`variabel ${t} tidak dikenal`);
      return vars[t];
    }
    return fail(`karakter "${t}" tidak boleh`);
  }

  const result = sum();
  if (pos < tokens.length) fail(`sisa "${tokens[pos]}"`);
  return result;
}