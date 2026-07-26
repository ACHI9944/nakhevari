// TODO: replace with the real Nakhevari contact number before shipping.
const phone = '+995 000 00 00 00'
const phoneDigits = phone.replace(/\D/g, '')

export const platformContact = {
  name: 'Nakhevari',
  phone,
  phoneHref: `tel:${phone}`,
  whatsappHref: `https://wa.me/${phoneDigits}`,
}
