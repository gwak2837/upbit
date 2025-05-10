import { UPBIT_API_URL } from '../constants/config'
import { logWriter } from '../lib/writer'
import { printNow } from '../utils/date'
import { createToken, rateLimit, type UpbitError } from './common'

type Asset = {
  avg_buy_price: string
  avg_buy_price_modified: boolean
  balance: string
  currency: string
  locked: string
  unit_currency: string
}

export async function getAssets() {
  await rateLimit()

  const response = await fetch(`${UPBIT_API_URL}/v1/accounts`, {
    headers: { Authorization: `Bearer ${createToken()}` },
  })

  if (!response.ok) {
    logWriter.write(`${printNow()} getAssets, , ${await response.text()}\n`)
    return null
  }

  const result = (await response.json()) as Asset[] | UpbitError

  if ('error' in result) {
    logWriter.write(`${printNow()} getAssets, , ${result.error}\n`)
    return null
  }

  return result
}
