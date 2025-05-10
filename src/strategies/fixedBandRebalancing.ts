import { MINIMUM_REBALANCING_AMOUNT } from '../constants/config'
import { NODE_ENV } from '../constants/env'
import { type Asset, getAssets } from '../upbit/asset'
import { type Candle, getLastestMinuteCandle } from '../upbit/candle'
import { buyLimit, cancelOrder, getOrders, sellLimit } from '../upbit/order'
import { addDecimal8 } from '../upbit/utils'
import { isDefined } from '../utils/type'

const portfolio = [
  {
    market: 'KRW-BTC',
    ratio: 32,
    threshold: 2,
  },
  {
    market: 'KRW-SUI',
    ratio: 32,
    threshold: 2,
  },
  {
    market: 'KRW-XRP',
    ratio: 32,
    threshold: 2,
  },
  // 나머지 비중은 현금
]

export async function doFixedBandRebalancing() {
  const { assets, latestMinuteCandles } = await fetchData()
  const assetValues = calculateAssetValue({ assets, candles: latestMinuteCandles })
  const { totalValue, prices, values } = assetValues
  let krwBalance = assetValues.krwBalance

  if (NODE_ENV === 'development') {
    const tableRows = portfolio.map(({ market, ratio }) => {
      const value = values[market] ?? 0
      return {
        Market: market,
        평가금액: value.toLocaleString(),
        현재비중: totalValue ? `${((value / totalValue) * 100).toFixed(2)}%` : '-',
        목표비중: `${ratio}%`,
      }
    })
    tableRows.push(
      {
        Market: 'KRW',
        평가금액: krwBalance.toLocaleString(),
        현재비중: totalValue ? `${((krwBalance / totalValue) * 100).toFixed(2)}%` : '-',
        목표비중: '-',
      },
      { Market: 'TOTAL', 평가금액: totalValue.toLocaleString(), 현재비중: '100%', 목표비중: '-' },
    )
    console.table(tableRows, ['Market', '평가금액', '현재비중', '목표비중'])
  }

  await cancelPendingOrders()

  /* 목표 비중 ±threshold 벗어난 자산 리밸런싱 */
  for (const { market, ratio, threshold } of portfolio) {
    const curValue = values[market] ?? 0
    const curRatio = (curValue / totalValue) * 100
    const lower = ratio - threshold
    const upper = ratio + threshold

    if (curRatio >= lower && curRatio <= upper) {
      console.log(`[PASS] ${market} ${curRatio.toFixed(2)}%`)
      continue
    }

    const bandRatio = curRatio > upper ? upper : lower
    const targetValue = (bandRatio / 100) * totalValue
    const diff = targetValue - curValue // +:매수 / -:매도
    const absDiff = Math.abs(diff)

    if (absDiff < MINIMUM_REBALANCING_AMOUNT) {
      console.log(`[SKIP] ${market} 차액 ${absDiff.toFixed(0)} 원 < MIN`)
      continue
    }

    const now = prices[market]
    if (now === undefined) throw new Error(`시세 정보를 불러오지 못했습니다. ${market}`) // 발생할 수 없는 오류

    if (diff > 0) {
      if (diff > krwBalance) {
        console.warn(`KRW 부족, ${market} 매수 스킵`)
        continue
      }
      await buyLimit(market, diff, now)
      krwBalance -= diff
      console.log(`[지정가 구매]  ${market}  ${diff.toFixed(0)} KRW`)
    } else {
      const volume = absDiff / now
      await sellLimit(market, volume, now)
      krwBalance += absDiff
      console.log(`[지정가 판매]  ${market}  ${volume.toFixed(8)}`)
    }
  }
}

function calculateAssetValue({ assets, candles }: { assets: Asset[]; candles: Candle[] }) {
  const krw = assets.find((a) => a.currency === 'KRW')
  const krwBalance = krw ? Number(addDecimal8(krw.balance, krw.locked)) : 0
  let totalValue = krwBalance

  const prices: Record<string, number> = {}
  const values: Record<string, number> = {}

  for (const candle of candles) {
    if (candle) prices[candle.market] = candle.trade_price
  }

  for (const { currency, balance, locked } of assets) {
    if (currency === 'KRW') continue
    const market = `KRW-${currency}`
    const price = prices[market]
    if (price === undefined) continue
    const value = Number(addDecimal8(balance, locked)) * price
    values[market] = value
    totalValue += value
  }

  return { krwBalance, totalValue, prices, values }
}

async function cancelPendingOrders() {
  const pendingOrderPromises = portfolio.map(({ market }) => getOrders({ market, state: 'wait', limit: 100, page: 1 }))
  const pendingOrders = await Promise.all(pendingOrderPromises)

  const cancelPromises = pendingOrders
    .flat()
    .filter(isDefined)
    .map((order) => cancelOrder(order.uuid))

  await Promise.all(cancelPromises)
}

async function fetchData() {
  const [assets, latestMinuteCandles] = await Promise.all([
    getAssets(),
    Promise.all(portfolio.map(({ market }) => getLastestMinuteCandle({ market }))),
  ])

  if (!assets) throw new Error('자산 정보를 불러오지 못했습니다.')
  if (latestMinuteCandles.includes(null)) throw new Error('시세 정보를 불러오지 못했습니다.')

  return { assets, latestMinuteCandles: latestMinuteCandles.filter(isDefined) }
}
