import { RateLimit } from 'async-sema'
import { createHash } from 'crypto'
import { sign } from 'jsonwebtoken'
import { v4 } from 'uuid'

import { MAXIMUM_CONCURRENT_REQUEST } from '../constants/config'
import { UPBIT_OPEN_API_ACCESS_KEY, UPBIT_OPEN_API_SECRET_KEY } from '../constants/env'

export type UpbitError = {
  error: {
    message: string
    name: string
  }
}

export const rateLimit = RateLimit(MAXIMUM_CONCURRENT_REQUEST)

export function createToken(query?: string) {
  return query
    ? sign(
        {
          access_key: UPBIT_OPEN_API_ACCESS_KEY,
          nonce: v4(),
          query_hash: createHash('sha512').update(query, 'utf-8').digest('hex'),
          query_hash_alg: 'SHA512',
        },
        UPBIT_OPEN_API_SECRET_KEY,
      )
    : sign(
        {
          access_key: UPBIT_OPEN_API_ACCESS_KEY,
          nonce: v4(),
        },
        UPBIT_OPEN_API_SECRET_KEY,
      )
}
