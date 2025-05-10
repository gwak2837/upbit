import 'dotenv/config'

import { getAssets } from './upbit/asset'

async function main() {
  const assets = await getAssets()
  console.log(assets)
}

main()
