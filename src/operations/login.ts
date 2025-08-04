import type { Payload, PayloadRequest, SanitizedCollectionConfig, TypedUser } from 'payload'

import { randomUUID } from 'node:crypto'
import {
  APIError,
  checkLoginPermission,
  getFieldsToSign,
  incrementLoginAttempts,
  jwtSign,
  ValidationError,
} from 'payload'

import type { AuthCollectionSlug, FindUserType } from '../types.js'

import { encrypt } from '../utilities/encrypt.js'
import { findUser } from '../utilities/findUser.js'
import { getLoginOptions } from '../utilities/getLoginOptions.js'

type BaseArgs = {
  collection: AuthCollectionSlug
  otp: string
  req: PayloadRequest
}

type Args = BaseArgs & FindUserType

/**
 * TODO: Remove when Payload exports this function
 */
const removeExpiredSessions = (
  sessions: { createdAt: Date | string; expiresAt: Date | string; id: string }[],
) => {
  const now = new Date()

  return sessions.filter(({ expiresAt }) => {
    const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
    return expiry > now
  })
}

/**
 * TODO: Remove when Payload exports this function
 */
const addUserSession = async ({
  collectionConfig,
  payload,
  req,
  user,
}: {
  collectionConfig: SanitizedCollectionConfig
  payload: Payload
  req: PayloadRequest
  user: TypedUser
}): Promise<{ sid?: string }> => {
  let sid: string | undefined
  if (collectionConfig.auth.useSessions) {
    // Add session to user
    sid = randomUUID()
    const now = new Date()
    const tokenExpInMs = collectionConfig.auth.tokenExpiration * 1000
    const expiresAt = new Date(now.getTime() + tokenExpInMs)

    const session = { id: sid, createdAt: now, expiresAt }

    if (!user.sessions?.length) {
      user.sessions = [session]
    } else {
      user.sessions = removeExpiredSessions(user.sessions)
      user.sessions.push(session)
    }

    await payload.db.updateOne({
      id: user.id,
      collection: collectionConfig.slug,
      data: user,
      req,
      returning: false,
    })

    user.collection = collectionConfig.slug
    user._strategy = 'local-jwt'
  }

  return {
    sid,
  }
}

export const loginWithOTP = async ({ type, collection, otp, req, value }: Args) => {
  const { context, payload } = req
  const collectionConfig = payload.collections[collection].config

  if (!collectionConfig.auth) {
    throw new APIError(
      `The collection "${collection}" must be an auth collection to use loginWithOTP.`,
    )
  }

  const matchedUser = await findUser({
    type,
    collection,
    otp: encrypt({ payload, value: otp }),
    payload,
    value,
  })

  const maxLoginAttemptsEnabled = collectionConfig.auth.maxLoginAttempts > 0

  if (!matchedUser) {
    if (maxLoginAttemptsEnabled) {
      await incrementLoginAttempts({
        collection: collectionConfig,
        doc: matchedUser,
        payload: req.payload,
        req,
      })
    }

    throw new ValidationError({
      collection: collectionConfig.slug,
      errors: [
        {
          message: 'Failed logging in with one-time password.',
          path: 'otp',
        },
      ],
    })
  }

  let user: TypedUser = {
    ...matchedUser,
    collection,
  }

  const { canLoginWithUsername } = getLoginOptions(collectionConfig.auth?.loginWithUsername)

  checkLoginPermission({
    loggingInWithUsername: Boolean(canLoginWithUsername && type === 'username'),
    req,
    user,
  })

  if (collectionConfig.hooks?.beforeLogin?.length) {
    for (const hook of collectionConfig.hooks.beforeLogin) {
      user =
        (await hook({
          collection: collectionConfig,
          context,
          req,
          user,
        })) || user
    }
  }

  const fieldsToSignArgs: Parameters<typeof getFieldsToSign>[0] = {
    collectionConfig,
    email: user.email!,
    user,
  }

  const { sid } = await addUserSession({
    collectionConfig,
    payload,
    req,
    user,
  })

  if (sid) {
    fieldsToSignArgs.sid = sid
  }

  req.user = user

  const { exp, token } = await jwtSign({
    fieldsToSign: getFieldsToSign(fieldsToSignArgs),
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  if (collectionConfig.hooks?.afterLogin?.length) {
    for (const hook of collectionConfig.hooks.afterLogin) {
      user =
        (await hook({
          collection: collectionConfig,
          context,
          req,
          token,
          user,
        })) || user
    }
  }

  const dataToUpdate: Record<string, unknown> = {
    _otp: null,
    _otpExpiration: null,
  }

  if (maxLoginAttemptsEnabled) {
    dataToUpdate.lockUntil = null
    dataToUpdate.loginAttempts = 0
  }

  await payload.db.updateOne({
    id: user.id,
    collection,
    data: dataToUpdate,
  })

  return { exp, token, user }
}
