function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderHtmlDocument({ title, description, canonicalUrl, image, body, type = 'website', noindex = false }) {
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description || '')
  const safeUrl = escapeHtml(canonicalUrl || '')
  const safeImage = image ? escapeHtml(image) : ''

  return `<!doctype html>
<html lang="ka">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    ${noindex ? '<meta name="robots" content="noindex" />' : ''}
    <link rel="canonical" href="${safeUrl}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${safeUrl}" />
    ${safeImage ? `<meta property="og:image" content="${safeImage}" />` : ''}
  </head>
  <body>
    ${body}
  </body>
</html>`
}

module.exports = {
  escapeHtml,
  renderHtmlDocument,
}
