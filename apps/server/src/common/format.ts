type DecimalLike = {
  toNumber: () => number;
};

export function toNumber(value: DecimalLike | number | string | null | undefined) {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return value.toNumber();
}

export function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}
