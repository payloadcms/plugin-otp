import { randomInt } from 'crypto'

export const generateOTP = (length = 6): string => {
  return Array.from({ length }, () => randomInt(0, 10).toString()).join('')
}
