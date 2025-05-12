import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { setOTP } from '../../../src/operations/requestOTP.js'

/**
 * USED FOR E2E TESTING ONLY - DO NOT USE IN REAL PROJECT
 * AS THIS IS HIGHLY INSECURE!
 */

export const GET = async () => {
  const payload = await getPayload({
    config: configPromise,
  })

  const result = await setOTP({
    type: 'email',
    collection: 'users',
    payload,
    value: 'dev@payloadcms.com',
  })

  console.log(result)

  return Response.json(result)
}
