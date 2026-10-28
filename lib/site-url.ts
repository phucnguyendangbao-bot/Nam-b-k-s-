const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

export const siteUrl = (configured
  ? configured
  : vercelHost
    ? `https://${vercelHost}`
    : 'https://nam-bo-ky-su.gladmouse16.chatgpt.site'
).replace(/\/$/, '');
