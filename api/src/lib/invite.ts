const DEFAULT_WEB_ORIGIN = 'http://localhost:5173';

function getInviteBaseUrl() {
  return (
    process.env.INVITE_BASE_URL ||
    process.env.WEB_APP_URL ||
    process.env.FRONTEND_URL ||
    DEFAULT_WEB_ORIGIN
  ).trim();
}

export function buildInviteUrl(token: string) {
  const base = getInviteBaseUrl().replace(/\/+$/, '');

  if (base.includes('{token}')) {
    return base.replace('{token}', token);
  }

  if (/\/convite$/i.test(base)) {
    return `${base}/${token}`;
  }

  return `${base}/convite/${token}`;
}
