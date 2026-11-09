"""Builds index.html (from index.template.html) and the privacy page. Run: python3 build.py"""
import re, html

stone = open('assets/stone.svg.txt').read()
wm = open('assets/wm.svg.txt').read()
path = re.search(r' d="([^"]+)"', stone).group(1)

# ---- team: edit here ----
TEAM = [
    ("Antonio Frungillo", "AF", "4mobility. Project contact."),
    ("Eren Hamza Kocabas", "EK", "4mobility"),
    ("Jonathan Ludoyo", "JL", "4mobility"),
    ("Bernardo Piccioli Aguiar", "BA", "4mobility"),
]

t = open('index.template.html').read()
t = t.replace('{{STONEPATH}}', path).replace('{{STONE}}', stone).replace('{{WM}}', wm)
t = re.sub(r' style="--d:([.\d]+s)"', r' data-d="\1"', t)
t = t.replace('Four students, one problem.', 'One team. One problem.')
cards = "\n".join(
    '      <li class="rv" data-d="%.2fs"><span class="fn">%s</span> %s</li>'
    % (i * 0.08, html.escape(n.split(" ", 1)[0]), html.escape(n.split(" ", 1)[1])) for i, (n, ini, r) in enumerate(TEAM))
t = t.replace('{{TEAM}}', cards)
import time  # cache-busting version on the CSS and JS links
v = str(int(time.time()))
t = t.replace('href="style.css"', 'href="style.css?v=' + v + '"').replace('src="main.js"', 'src="main.js?v=' + v + '"')
open('index.html', 'w').write(t)

open('assets/icon.svg', 'w').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" rx="52" fill="#3a3d43"/>'
    '<g transform="translate(20 0)"><path fill="#f4f6f8" fill-rule="evenodd" d="%s"/></g></svg>' % path)

j = open('main.js').read()
if "data-d" not in j:
    j = j.replace("  /* nav background", "  $$('[data-d]').forEach(function (el) { el.style.setProperty('--d', el.dataset.d); });\n\n  /* nav background", 1)
    open('main.js', 'w').write(j)

# ---- privacy page, derived from the web app's statement ----
s = open('../milezero-web/privacy/index.html').read()
css = re.search(r'<style>(.*?)</style>', s, re.S).group(1)
css = css.replace('--display:"Barlow Condensed","Arial Narrow",system-ui,sans-serif',
                  '--display:"Barlow Condensed","Avenir Next Condensed","DIN Condensed","Arial Narrow",system-ui,sans-serif')
css = css.replace('--body:"IBM Plex Sans",', '--body:').replace('--mono:"IBM Plex Mono",', '--mono:')
css += "\n.sec-l{display:flex;flex-direction:column;gap:16px}\n"
fonts = [("Barlow Condensed", 800, "barlow-condensed-latin-800-normal"), ("IBM Plex Sans", 400, "ibm-plex-sans-latin-400-normal"),
         ("IBM Plex Sans", 500, "ibm-plex-sans-latin-500-normal"), ("IBM Plex Mono", 500, "ibm-plex-mono-latin-500-normal")]
css = "".join('@font-face{font-family:"%s";font-weight:%d;font-display:swap;src:url(../assets/fonts/%s.woff2) format("woff2")}\n' % f for f in fonts) + css
css = css.replace('--body:-apple-system', '--body:"IBM Plex Sans",-apple-system').replace('--mono:ui-monospace', '--mono:"IBM Plex Mono",ui-monospace')
open('privacy/privacy.css', 'w').write(css)

s = re.sub(r'<link rel="preconnect"[^>]*>\n?', '', s)
s = re.sub(r'<link rel="stylesheet" href="https://fonts[^>]*>', '<link rel="stylesheet" href="privacy.css">', s)
s = re.sub(r'<style>.*?</style>\n?', '', s, flags=re.S)
csp = ("<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'self'; style-src 'self'; "
       "img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'\">\n"
       "<meta name=\"referrer\" content=\"no-referrer\">\n<meta name=\"theme-color\"")
s = s.replace('<meta name="theme-color"', csp, 1)
s = s.replace('<link rel="icon" href="../icons/icon-192.png">', '<link rel="icon" href="../assets/icon.svg" type="image/svg+xml">')
s = s.replace('<title>MileZero privacy</title>',
              '<title>MileZero privacy</title>\n'
              '<link rel="canonical" href="https://antoniotakor-tech.github.io/milezero-site/privacy/">\n'
              '<meta property="og:title" content="MileZero privacy statement">\n'
              '<meta property="og:description" content="What MileZero reads, what it keeps, and what it sends. In full.">\n'
              '<meta property="og:type" content="website">\n'
              '<meta property="og:image" content="https://antoniotakor-tech.github.io/milezero-site/assets/og-image.png">')
s = s.replace(' style="display:flex;flex-direction:column;gap:16px"', ' class="sec-l"')
sc = re.search(r'<script>(.*?)</script>', s, re.S).group(1)
sc = sc.replace('s.hidden = s.dataset.lang !== l; s.style.display = s.hidden ? "none" : "flex";', 's.hidden = s.dataset.lang !== l;')
open('privacy/privacy.js', 'w').write(sc)
s = re.sub(r'<script>.*?</script>', '<script src="privacy.js"></script>', s, flags=re.S)
s = re.sub(r'<tr><td>Fonts</td>.*?</tr>',
           '<tr><td>Fonts</td><td>Served from this website itself. No font provider, such as Google Fonts, receives your IP address.</td></tr>', s)
s = re.sub(r'<tr><td>Lettertypen</td>.*?</tr>',
           '<tr><td>Lettertypen</td><td>Komen van deze website zelf. Geen lettertype-aanbieder, zoals Google Fonts, ontvangt je IP-adres.</td></tr>', s)
s = s.replace('<tr><td>The web demo and these pages (milezero-e4k.pages.dev)</td>',
              '<tr><td>The landing page and this page</td><td><b>No cookies.</b> Nothing is stored in your browser: the cookie notice appears on every visit because your choice is not remembered. No analytics and no calls to other servers. See the <a href="../cookies/">cookie policy</a>.</td></tr>\n    <tr><td>The web demo (milezero-e4k.pages.dev)</td>')
s = s.replace('<tr><td>De webdemo en deze pagina&rsquo;s (milezero-e4k.pages.dev)</td>',
              '<tr><td>De landingspagina en deze pagina</td><td><b>Geen cookies.</b> Er wordt niets in je browser opgeslagen: de cookiemelding verschijnt bij elk bezoek, omdat je keuze niet wordt onthouden. Geen analyse en geen verbinding met andere servers. Zie het <a href="../cookies/">cookiebeleid</a>.</td></tr>\n    <tr><td>De webdemo (milezero-e4k.pages.dev)</td>')
s = s.replace('<h2>5. Cookies and similar technologies</h2>', '<h2 id="cookies">5. Cookies and similar technologies</h2>')
s = s.replace('Last updated 5 November 2026', 'Last updated 9 November 2026').replace('Laatst bijgewerkt op 5 november 2026', 'Laatst bijgewerkt op 9 november 2026')
open('privacy/index.html', 'w').write(s)

# NOTE: deliberately no _headers file. GitHub Pages does not read it (that syntax is
# Cloudflare/Netlify-specific) — a _headers file here would claim protections that are never
# actually sent. Real equivalents are the <meta> CSP/referrer tags in each template, plus the
# per-page frame-busting guard in main.js for the one protection meta tags can't provide.

# ---- cookie policy page ----
import os
os.makedirs('cookies', exist_ok=True)
c = open('cookies.template.html').read().replace('{{STONE}}', stone).replace('{{WM}}', wm)
open('cookies/index.html', 'w').write(c)

# privacy page: this site is on GitHub Pages; link the cookie policy
p = open('privacy/index.html').read()
p = p.replace('The pages are hosted on Cloudflare Pages. Like any web host, it may',
              'This website is hosted on GitHub Pages (GitHub, Inc., United States) and the web demo on Cloudflare Pages. Like any web host, they may')
p = p.replace('De pagina&rsquo;s staan op Cloudflare Pages. Zoals elke webhost kan die',
              'Deze website staat op GitHub Pages (GitHub, Inc., Verenigde Staten) en de webdemo op Cloudflare Pages. Zoals elke webhost kunnen die')
p = p.replace('<h2 id="cookies">5. Cookies and similar technologies</h2>',
              '<h2 id="cookies">5. Cookies and similar technologies</h2>\n<p>Full details are in the <a href="../cookies/">cookie policy</a>.</p>')
p = p.replace('<h2>5. Cookies en vergelijkbare technieken</h2>',
              '<h2>5. Cookies en vergelijkbare technieken</h2>\n<p>Alle details staan in het <a href="../cookies/">cookiebeleid</a>.</p>')
open('privacy/index.html', 'w').write(p)
print("built")
