const UNIT = 100_000_000

export function addDecimal8(a: string, b: string) {
  const sum = toInt8(a) + toInt8(b)
  return (sum / UNIT).toFixed(8)
}

function toInt8(value: string): number {
  const [intPart = '0', fracPart = ''] = value.split('.')
  const padded = (fracPart + '00000000').slice(0, 8)
  return UNIT * Number(intPart) + Number(padded)
}
