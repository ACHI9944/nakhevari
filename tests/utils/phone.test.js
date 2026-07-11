import { describe, expect, it } from 'vitest'
import { isValidGeorgianPhone, normalizeGeorgianPhone } from '../../src/utils/phone'

describe('normalizeGeorgianPhone', () => {
  it('adds the +995 country code to a bare 9-digit mobile number', () => {
    expect(normalizeGeorgianPhone('555123456')).toBe('+995555123456')
  })

  it('strips spaces, dashes and parentheses before matching', () => {
    expect(normalizeGeorgianPhone('(555) 123-456')).toBe('+995555123456')
    expect(normalizeGeorgianPhone('555 12 34 56')).toBe('+995555123456')
  })

  it('leaves an already-prefixed number unchanged', () => {
    expect(normalizeGeorgianPhone('+995555123456')).toBe('+995555123456')
  })

  it('leaves numbers that do not match the bare-mobile pattern unchanged', () => {
    expect(normalizeGeorgianPhone('12345')).toBe('12345')
  })
})

describe('isValidGeorgianPhone', () => {
  it('accepts a normalized Georgian mobile number', () => {
    expect(isValidGeorgianPhone('+995555123456')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isValidGeorgianPhone('555123456')).toBe(false)
    expect(isValidGeorgianPhone('+99555512345')).toBe(false)
    expect(isValidGeorgianPhone('')).toBe(false)
  })
})
