const { onRequest } = require('firebase-functions/v2/https')
const { REGION } = require('../lib/config')
const { db } = require('../lib/firebase')

const sitemapFetchCap = 5000

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toIsoDate(value) {
  return typeof value?.toDate === 'function' ? value.toDate().toISOString() : new Date().toISOString()
}

exports.renderSitemap = onRequest({ region: REGION }, async (req, res) => {
  const origin = `${req.protocol}://${req.get('host')}`

  const snapshot = await db.collection('listings')
    .where('status', '==', 'published')
    .limit(sitemapFetchCap)
    .get()

  const urls = [
    { loc: `${origin}/` },
    { loc: `${origin}/listings` },
    ...snapshot.docs.map(doc => ({
      loc: `${origin}/listing/${doc.id}`,
      lastmod: toIsoDate(doc.data().updatedAt),
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${escapeXml(url.lastmod)}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`

  res.set('Content-Type', 'application/xml')
  res.set('Cache-Control', 'public, max-age=300, s-maxage=3600')
  res.status(200).send(xml)
})
