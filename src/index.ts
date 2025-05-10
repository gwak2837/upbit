import 'dotenv/config'
import { sleep } from 'bun'

import { REBALANCING_INTERVAL } from './constants/config'
import { logWriter } from './lib/writer'
import { doFixedBandRebalancing } from './strategies/fixedBandRebalancing'
import { printNow } from './utils/date'

async function main() {
  while (true) {
    try {
      await doFixedBandRebalancing()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logWriter.write(`${printNow()} ${JSON.stringify(errorMessage)}\n`)
    }

    await sleep(REBALANCING_INTERVAL)
  }
}

main()
