import { BigNumber } from './utils/bignumber';

export const BONE = new BigNumber(10).pow(18);
export const TWOBONE = BONE.times(new BigNumber(2));
const BPOW_PRECISION = BONE.idiv(new BigNumber(10).pow(10));

export const MAX_IN_RATIO = BONE.times(new BigNumber(0.499999999999999)); // Leave some room for bignumber rounding errors
export const MAX_OUT_RATIO = BONE.times(new BigNumber(0.333333333333333)); // Leave some room for bignumber rounding errors

export function bmul(a: BigNumber, b: BigNumber): BigNumber {
  const c0 = a.times(b);
  const c1 = c0.plus(BONE.div(new BigNumber(2)));
  const c2 = c1.idiv(BONE);
  return c2;
}

export function bdiv(a: BigNumber, b: BigNumber): BigNumber {
  const c0 = a.times(BONE);
  const c1 = c0.plus(b.div(new BigNumber(2)));
  const c2 = c1.idiv(b);
  return c2;
}

export function btoi(a: BigNumber): BigNumber {
  return a.idiv(BONE);
}

export function bfloor(a: BigNumber): BigNumber {
  return btoi(a).times(BONE);
}

export function bsubSign(
  a: BigNumber,
  b: BigNumber
): { res: BigNumber; bool: boolean } {
  if (a.gte(b)) {
    const res = a.minus(b);
    const bool = false;
    return { res, bool };
  } else {
    const res = b.minus(a);
    const bool = true;
    return { res, bool };
  }
}

function bpowi(a: BigNumber, n: BigNumber): BigNumber {
  let z = !n.modulo(new BigNumber(2)).eq(new BigNumber(0)) ? a : BONE;

  for (
    n = n.idiv(new BigNumber(2));
    !n.eq(new BigNumber(0));
    n = n.idiv(new BigNumber(2))
  ) {
    a = bmul(a, a);
    if (!n.modulo(new BigNumber(2)).eq(new BigNumber(0))) {
      z = bmul(z, a);
    }
  }
  return z;
}

function bpowApprox(
  base: BigNumber,
  exp: BigNumber,
  precision: BigNumber
): BigNumber {
  const a = exp;
  const { res: x, bool: xneg } = bsubSign(base, BONE);
  let term = BONE;
  let sum = term;
  let negative = false;

  for (let i = 1; term.gte(precision); i++) {
    const bigK = new BigNumber(i).times(BONE);
    const { res: c, bool: cneg } = bsubSign(a, bigK.minus(BONE));
    term = bmul(term, bmul(c, x));
    term = bdiv(term, bigK);
    if (term.eq(new BigNumber(0))) break;

    if (xneg) negative = !negative;
    if (cneg) negative = !negative;
    if (negative) {
      sum = sum.minus(term);
    } else {
      sum = sum.plus(term);
    }
  }

  return sum;
}

export function bpow(base: BigNumber, exp: BigNumber): BigNumber {
  const whole = bfloor(exp);
  const remain = exp.minus(whole);
  const wholePow = bpowi(base, btoi(whole));
  if (remain.eq(new BigNumber(0))) {
    return wholePow;
  }

  const partialResult = bpowApprox(base, remain, BPOW_PRECISION);
  return bmul(wholePow, partialResult);
}

export function scale(input: BigNumber, decimalPlaces: number): BigNumber {
  const scalePow = new BigNumber(decimalPlaces.toString());
  const scaleMul = new BigNumber(10).pow(scalePow);
  return input.times(scaleMul);
}

export function bnum(val: string | number | BigNumber): BigNumber {
  return new BigNumber(val.toString());
}

export function calcOutGivenIn(
  tokenBalanceIn: BigNumber,
  tokenWeightIn: BigNumber,
  tokenBalanceOut: BigNumber,
  tokenWeightOut: BigNumber,
  tokenAmountIn: BigNumber,
  swapFee: BigNumber
): BigNumber {
  const weightRatio = bdiv(tokenWeightIn, tokenWeightOut);
  let adjustedIn = BONE.minus(swapFee);
  adjustedIn = bmul(tokenAmountIn, adjustedIn);
  const y = bdiv(tokenBalanceIn, tokenBalanceIn.plus(adjustedIn));
  const foo = bpow(y, weightRatio);
  const bar = BONE.minus(foo);
  const tokenAmountOut = bmul(tokenBalanceOut, bar);
  return tokenAmountOut;
}

export function calcInGivenOut(
  tokenBalanceIn: BigNumber,
  tokenWeightIn: BigNumber,
  tokenBalanceOut: BigNumber,
  tokenWeightOut: BigNumber,
  tokenAmountOut: BigNumber,
  swapFee: BigNumber
) {
  const weightRatio = bdiv(tokenWeightOut, tokenWeightIn);
  const diff = tokenBalanceOut.minus(tokenAmountOut);
  const y = bdiv(tokenBalanceOut, diff);
  let foo = bpow(y, weightRatio);
  foo = foo.minus(BONE);
  let tokenAmountIn = BONE.minus(swapFee);
  tokenAmountIn = bdiv(bmul(tokenBalanceIn, foo), tokenAmountIn);
  return tokenAmountIn;
}

export function calcSpotPrice(
  tokenBalanceIn: BigNumber,
  tokenWeightIn: BigNumber,
  tokenBalanceOut: BigNumber,
  tokenWeightOut: BigNumber,
  swapFee: BigNumber
) {
  const numer = bdiv(tokenBalanceIn, tokenWeightIn);
  const denom = bdiv(tokenBalanceOut, tokenWeightOut);
  const ratio = bdiv(numer, denom);
  const scale = bdiv(BONE, bsubSign(BONE, swapFee).res);
  return bmul(ratio, scale);
}
