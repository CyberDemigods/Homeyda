const CANONICAL_HOST = "homeyda.com";
const REDIRECT_HOSTS = new Set([
  "homeyda.cyberdemigods.com",
  "www.homeyda.com",
  "homeyda.pages.dev",
]);

export const onRequest = async (context) => {
  const url = new URL(context.request.url);
  if (REDIRECT_HOSTS.has(url.hostname)) {
    url.hostname = CANONICAL_HOST;
    url.port = "";
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
};
