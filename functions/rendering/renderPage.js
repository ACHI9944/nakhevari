const { onRequest } = require('firebase-functions/v2/https')
const fs = require('node:fs')
const path = require('node:path')
const { REGION } = require('../lib/config')
const { db } = require('../lib/firebase')
const { isBotRequest } = require('./botDetect')
const { escapeHtml, renderHtmlDocument } = require('./htmlTemplates')

const spaShellPath = path.join(__dirname, 'spa-shell.html')
let cachedSpaShell = null

function getSpaShell() {
  if (!cachedSpaShell) cachedSpaShell = fs.readFileSync(spaShellPath, 'utf8')
  return cachedSpaShell
}

const siteName = 'თითქმის ნახევარი'
const siteDescription = 'ამერიკიდან გზაში მყოფი ავტომობილების სანდო პლატფორმა საქართველოში.'

const fuelLabels = {
  gasoline: 'ბენზინი',
  hybrid: 'ჰიბრიდი',
  plug_in_hybrid: 'Plug-in ჰიბრიდი',
  electric: 'ელექტრო',
  diesel: 'დიზელი',
}

const transmissionLabels = {
  automatic: 'ავტომატიკა',
  manual: 'მექანიკა',
}

function renderHome(origin) {
  const body = `
    <h1>${escapeHtml(siteName)}</h1>
    <p>${escapeHtml(siteDescription)}</p>
    <p><a href="/listings">ყველა განცხადების ნახვა</a></p>
  `
  return renderHtmlDocument({
    title: `${siteName} — მანქანები გზაში`,
    description: siteDescription,
    canonicalUrl: `${origin}/`,
    body,
  })
}

async function renderListing(listingId, origin) {
  const snapshot = await db.collection('listings').doc(listingId).get()
  if (!snapshot.exists) return null

  const listing = snapshot.data()
  if (listing.status !== 'published') return null

  const make = listing.make || ''
  const model = listing.model || ''
  const year = listing.year || ''
  const price = Number(listing.price) || 0
  const mileage = Number(listing.mileage) || 0
  const fuel = fuelLabels[listing.fuel] || listing.fuel || ''
  const transmission = transmissionLabels[listing.transmission] || listing.transmission || ''
  const vin = listing.vin || ''
  const damageDescription = listing.damageDescription || ''
  const images = [
    ...(Array.isArray(listing.images) ? listing.images : []),
    listing.image,
  ].filter(image => typeof image === 'string' && image.trim())

  const title = `${year} ${make} ${model}`.trim()
  const description = [
    price ? `ფასი: $${price.toLocaleString()}` : '',
    mileage ? `გარბენი: ${mileage.toLocaleString()} კმ` : '',
    fuel,
    transmission,
  ].filter(Boolean).join(' · ')

  const specRows = [
    ['წელი', year],
    ['ფასი', price ? `$${price.toLocaleString()}` : ''],
    ['გარბენი', mileage ? `${mileage.toLocaleString()} კმ` : ''],
    ['საწვავი', fuel],
    ['გადაცემათა კოლოფი', transmission],
    ['VIN', vin],
  ].filter(([, value]) => value)

  const body = `
    <h1>${escapeHtml(title)}</h1>
    <ul>
      ${specRows.map(([label, value]) => `<li>${escapeHtml(label)}: ${escapeHtml(String(value))}</li>`).join('\n')}
    </ul>
    ${damageDescription ? `<p>${escapeHtml(damageDescription)}</p>` : ''}
    ${images.map(src => `<img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" />`).join('\n')}
  `

  return renderHtmlDocument({
    title: `${title} — ${siteName}`,
    description: description || siteDescription,
    canonicalUrl: `${origin}/listing/${listingId}`,
    image: images[0] || '',
    body,
    type: 'product',
  })
}

exports.renderPage = onRequest({ region: REGION }, async (req, res) => {
  const userAgent = req.get('user-agent') || ''
  const origin = `${req.protocol}://${req.get('host')}`

  if (!isBotRequest(userAgent)) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.status(200).send(getSpaShell())
    return
  }

  try {
    const listingMatch = req.path.match(/^\/listing\/([^/]+)\/?$/)

    if (listingMatch) {
      const html = await renderListing(decodeURIComponent(listingMatch[1]), origin)
      if (!html) {
        res.set('Cache-Control', 'no-cache')
        res.status(404).send(renderHtmlDocument({
          title: `ვერ მოიძებნა — ${siteName}`,
          description: 'მოთხოვნილი განცხადება არ არსებობს ან აღარ არის ხელმისაწვდომი.',
          canonicalUrl: origin + req.path,
          body: '<h1>განცხადება ვერ მოიძებნა</h1>',
          noindex: true,
        }))
        return
      }
      res.set('Cache-Control', 'public, max-age=300, s-maxage=3600')
      res.status(200).send(html)
      return
    }

    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600')
    res.status(200).send(renderHome(origin))
  } catch (error) {
    console.error('renderPage failed', error)
    res.set('Cache-Control', 'no-cache')
    res.status(200).send(getSpaShell())
  }
})
