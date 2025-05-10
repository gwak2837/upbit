export function printNow() {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }).padEnd(25, ' ')
}
