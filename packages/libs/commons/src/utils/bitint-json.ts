
export function stringifyJSON(obj: any, space = 0) {
  return JSON.stringify(
    obj,
    (_, v) => {
      if (typeof v === 'bigint') {
        return `${v}n`;
      } else {
        return v;
      }
    },
    space,
  );
}

export function parseJSON(str: string) {
  return JSON.parse(str, (_, v) =>
    typeof v === 'string' && v.endsWith('n') ? BigInt(v.slice(0, -1)) : v,
  );
}
