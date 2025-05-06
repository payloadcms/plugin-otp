import type { GeneratedTypes, TypedUser } from 'payload'

export type ResolveAuthCollectionSlug<T> = 'auth' extends keyof T ? keyof T['auth'] : string

export type AuthCollectionSlug = ResolveAuthCollectionSlug<GeneratedTypes>

export type OTPPluginCollectionOptions = {
  /**
   * If you would like to handle sending the OTP yourself, via SMS or similar,
   * disable the email that is sent by passing `true`.
   */
  disableEmail?: boolean
  /**
   * Define how many seconds for the one-time password to be valid. Defaults to 5 minutes.
   */
  exp?: number
  /**
   * Customize the HTML that is sent in the OTP email sent to the user.
   */
  generateOTPEmailHTML?: GenerateOTPEmailHTML
  /**
   * Customize the subject that is sent in the OTP email sent to the user.
   */
  generateOTPEmailSubject?: GenerateOTPEmailSubject
  /**
   * Hook into plugin actions.
   */
  hooks?: {
    /**
     * These hooks will run after the OTP is saved on the user.
     */
    afterSetOTP?: AfterSetOTPHook<AuthCollectionSlug>[]
  }
}

export type OTPPluginOptions = {
  collections: Partial<{
    [K in AuthCollectionSlug]: OTPPluginCollectionOptions | true
  }>
}

export type AfterSetOTPHook<TSlug extends AuthCollectionSlug> = (args: {
  /**
   * The collection slug that the user belongs to.
   */
  collection: TSlug
  /**
   * The one-time password that was saved on the user.
   */
  otp: string
  /**
   * The user that has requested a one-time password.
   */
  user: TypedUser
}) => Promise<void>

export type GenerateOTPEmailArgs<TSlug extends AuthCollectionSlug> = {
  /**
   * The collection slug that the user belongs to.
   */
  collection: TSlug
  /**
   * The one-time password that was saved on the user.
   */
  otp: string
  /**
   * The user that has requested a one-time password.
   */
  user: TypedUser
}

export type GenerateOTPEmailHTML = (
  args: GenerateOTPEmailArgs<AuthCollectionSlug>,
) => Promise<string> | string
export type GenerateOTPEmailSubject = (
  args: GenerateOTPEmailArgs<AuthCollectionSlug>,
) => Promise<string> | string

export type FindUserType =
  | { type: 'email'; value: string }
  | { type: 'id'; value: number | string }
  | { type: 'username'; value: string }

export type OTPPluginConfig = {
  collections: {
    [slug: string]: OTPPluginCollectionOptions
  }
}
