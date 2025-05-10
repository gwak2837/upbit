import { encode } from 'querystring'

import { UPBIT_API_URL } from '../constants/config'
import { logWriter } from '../lib/writer'
import { printNow } from '../utils/date'
import { createToken, rateLimit, type UpbitError } from './common'

type GetOrdersBody = {
  market: string
  limit?: number
  page?: number
  state?: string
  states?: string[]
}

type OrderCoinBody = {
  market: string
  ord_type: 'limit' | 'market' | 'price'
  side: 'ask' | 'bid'
  price?: string
  volume?: string
}

type UpbitOrder = {
  created_at: string
  executed_volume: string
  locked: string
  market: string
  ord_type: string
  paid_fee: string
  price: string
  remaining_fee: string
  remaining_volume: string
  reserved_fee: string
  side: string
  state: string
  trades_count: number
  uuid: string
  volume: string
}

interface UpbitOrderDetail extends UpbitOrder {
  trades: [
    {
      funds: string
      market: string
      price: string
      side: string
      uuid: string
      volume: string
    },
  ]
}

export function buyLimit(market: string, krw: number, price: number) {
  const volume = krw / price
  return orderCoin({
    market,
    side: 'bid',
    ord_type: 'limit',
    price: price.toFixed(0),
    volume: volume.toFixed(8),
  })
}

export async function cancelOrder(uuid: string) {
  const query = encode({ uuid })

  await rateLimit()

  const response = await fetch(`${UPBIT_API_URL}/v1/order?${query}`, {
    headers: {
      Authorization: `Bearer ${createToken(query)}`,
    },
    method: 'DELETE',
  })

  if (!response.ok) {
    logWriter.write(`${printNow()} cancelOrder, ${uuid}, ${await response.text()}\n`)
    return null
  }

  const result = (await response.json()) as UpbitError | UpbitOrder

  if ('error' in result) {
    logWriter.write(`${printNow()} cancelOrder, ${uuid}, ${result.error}\n`)
    return null
  }

  return result
}

export async function getOrders(body: GetOrdersBody) {
  await rateLimit()

  const states = body.states
  delete body.states

  let query = encode(body)

  if (states) {
    query += states.map((state) => `&states[]=${state}`).join('')
  }

  const response = await fetch(`${UPBIT_API_URL}/v1/orders?${query}`, {
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${createToken(query)}`,
    },
  })

  if (!response.ok) {
    logWriter.write(`${printNow()} getOrders, ${JSON.stringify(body)}, ${await response.text()}\n`)
    return null
  }

  const result = (await response.json()) as UpbitError | UpbitOrderDetail[]

  if ('error' in result) {
    logWriter.write(`${printNow()} getOrders, ${JSON.stringify(body)}, ${result.error}\n`)
    return null
  }

  return result
}

export async function orderCoin(body: OrderCoinBody) {
  await rateLimit()

  const response = await fetch(`${UPBIT_API_URL}/v1/orders`, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${createToken(encode(body))}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    logWriter.write(`${printNow()} orderCoin, ${JSON.stringify(body)}, ${await response.text()}\n`)
    return null
  }

  const result = (await response.json()) as UpbitError | UpbitOrder

  if ('error' in result) {
    logWriter.write(`${printNow()} orderCoin, ${JSON.stringify(body)}, ${result.error}\n`)
    return null
  }

  return result
}

export function sellLimit(market: string, volume: number, price: number) {
  return orderCoin({
    market,
    side: 'ask',
    ord_type: 'limit',
    price: price.toFixed(0),
    volume: volume.toFixed(8),
  })
}
