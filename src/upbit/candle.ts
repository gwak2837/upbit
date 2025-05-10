import { UPBIT_API_URL } from '../constants/config'
import { logWriter } from '../lib/writer'
import { printNow } from '../utils/date'
import { rateLimit, type UpbitError } from './common'

export type Candle = {
  candle_acc_trade_price: number
  candle_acc_trade_volume: number
  candle_date_time_kst: string
  candle_date_time_utc: string
  high_price: number
  low_price: number
  market: string
  opening_price: number
  timestamp: number
  trade_price: number
  unit: number
}

type MinuteCandleInput = {
  market: string
}

export async function getLastestMinuteCandle({ market }: MinuteCandleInput) {
  await rateLimit()
  const response = await fetch(`${UPBIT_API_URL}/v1/candles/minutes/1?market=${market}&count=1`)

  if (!response.ok) {
    logWriter.write(`${printNow()} getMinuteCandles, ${await response.text()}\n`)
    return null
  }

  const result = (await response.json()) as Candle[] | UpbitError

  if ('error' in result) {
    logWriter.write(`${printNow()} getMinuteCandles, ${result.error}\n`)
    return null
  }

  return result[0]
}
