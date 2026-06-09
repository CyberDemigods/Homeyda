const CANONICAL_HOST = "homeyda.com";
const REDIRECT_HOSTS = new Set([
  "homeyda.cyberdemigods.com",
  "www.homeyda.com",
  "homeyda.pages.dev",
]);

// Collapse legacy-host requests straight to the clean canonical URL in a single
// 301 hop — strip any .html / index.html so we never chain into CF's own
// extensionless 308 (avoids multi-hop redirect chains that Google flags).
function normalizePath(pathname) {
  if (pathname === "/index.html") return "/";
  if (pathname.endsWith("/index.html")) return pathname.slice(0, -"index.html".length);
  if (pathname.endsWith(".html")) return pathname.slice(0, -".html".length);
  return pathname;
}

export const onRequest = async (context) => {
  const url = new URL(context.request.url);
  if (REDIRECT_HOSTS.has(url.hostname)) {
    url.hostname = CANONICAL_HOST;
    url.port = "";
    url.pathname = normalizePath(url.pathname);
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
};
