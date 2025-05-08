import type { DataFromCollectionSlug, Payload } from 'payload'

import { APIError } from 'payload'

import type { AuthCollectionSlug, FindUserType, OTPPluginCollectionOptions } from '../types.js'

import { defaultExp, getDefaultOTPEmailHTML, getDefaultOTPEmailSubject } from '../defaults.js'
import { encrypt } from '../utilities/encrypt.js'
import { findUser } from '../utilities/findUser.js'
import { generateOTP } from '../utilities/generateOTP.js'

type BaseArgs = {
  collection: AuthCollectionSlug
  exp?: number
  payload: Payload
}

type Args = BaseArgs & FindUserType

export const setOTP = async ({
  type,
  collection,
  exp: expOverride,
  payload,
  value,
}: Args): Promise<{ otp: string; user: DataFromCollectionSlug<AuthCollectionSlug> }> => {
  if (!type) {
    throw new APIError('No login type specified', 400)
  }

  if (!value) {
    throw new APIError(`No ${type} provided`, 400)
  }

  const otp = generateOTP()
  const user = await findUser({ type, collection, payload, value })

  const collectionOptions: OTPPluginCollectionOptions =
    payload.config.custom.otp.collections[collection]

  const exp = expOverride ?? collectionOptions?.exp ?? defaultExp

  const _otpExpiration = new Date(Date.now() + exp * 1000).toISOString()

  try {
    await payload.db.updateOne({
      id: user.id,
      collection,
      data: {
        _otp: encrypt({ payload, value: otp }),
        _otpExpiration,
      },
      select: {},
    })
  } catch (err) {
    const errorMessage = `Error setting one-time password for ${type}: ${value}`
    payload.logger.error(err, errorMessage)
    throw new APIError(errorMessage)
  }

  if (!collectionOptions.disableEmail) {
    const html =
      typeof collectionOptions?.generateOTPEmailHTML === 'function'
        ? await collectionOptions.generateOTPEmailHTML({
            collection,
            otp,
            user,
          })
        : getDefaultOTPEmailHTML({ collection, otp, user })

    const subject =
      typeof collectionOptions?.generateOTPEmailSubject === 'function'
        ? await collectionOptions.generateOTPEmailSubject({
            collection,
            otp,
            user,
          })
        : getDefaultOTPEmailSubject({ collection, otp, user })

    if ('email' in user) {
      await payload.email.sendEmail({
        from: `"${payload.email.defaultFromName}" <${payload.email.defaultFromAddress}>`,
        html,
        subject,
        to: user.email,
      })
    } else {
      throw new APIError(
        `Attempted to send email to user with ${type}: ${value}, but user has no email specified.`,
      )
    }
  }

  if (Array.isArray(collectionOptions?.hooks?.afterSetOTP)) {
    for (const hook of collectionOptions.hooks.afterSetOTP) {
      await hook({ collection, otp, user })
    }
  }

  return { otp, user }
}
