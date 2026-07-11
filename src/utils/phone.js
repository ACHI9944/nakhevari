export const normalizeGeorgianPhone = value => {
  const phone = String(value || '').replace(/[\s()-]/g, '')
  return /^5\d{8}$/.test(phone) ? `+995${phone}` : phone
}

export const isValidGeorgianPhone = phone => /^\+9955\d{8}$/.test(phone)
