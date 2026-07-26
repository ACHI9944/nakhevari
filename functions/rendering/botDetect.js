const BOT_USER_AGENT_PATTERN = new RegExp([
  'Googlebot',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'WhatsApp',
  'TelegramBot',
  'Discordbot',
  'Pinterest',
  'redditbot',
  'Applebot',
  'ia_archiver',
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Amazonbot',
].join('|'), 'i')

function isBotRequest(userAgent) {
  return BOT_USER_AGENT_PATTERN.test(userAgent || '')
}

module.exports = {
  isBotRequest,
}
