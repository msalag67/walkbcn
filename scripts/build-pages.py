#!/usr/bin/env python3
"""Build the pages search engines and AI assistants can read.

The app builds everything with JavaScript and lives at a single address, so from outside it
looks almost empty. This script writes, from the same data the app uses:

  <lang>/<stop-id>/index.html   one page per stop and language: the story as text, photo
                                with credit, what to look at, tip, nearby stops, and a
                                "Listen in WalkBCN" button that opens that stop in the app
  <lang>/index.html             every stop in that language, by neighbourhood
  sitemap.xml                   every address, with its other languages (hreflang)
  robots.txt, llms.txt          crawler rules and a plain description of WalkBCN
  index.html                    description, share preview and structured data between
                                <!-- seo:start --> and <!-- seo:end -->, and a footer link
                                to the stop list

Run it again whenever stories, stops or translations change:

    python3 scripts/build-pages.py
    python3 scripts/build-pages.py --base=https://walkbcn.com/   # with your own domain

Needs no Node: the data files are read with the JavaScript engine built into macOS
(osascript). Nothing here calls a network service.
"""
import datetime, html, json, math, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--base=")), "https://msalag67.github.io/walkbcn/")
BASE = BASE.rstrip("/") + "/"
LANGS = ["en", "es", "ca", "fr", "de", "it", "zh"]
TODAY = datetime.date.today().isoformat()

# Words the app has no string for. Short, and only for these pages.
W = {
    "titleTail": {"en": "story and what to see", "es": "historia y qué ver", "ca": "història i què veure", "fr": "histoire et que voir", "de": "Geschichte und Sehenswertes", "it": "storia e cosa vedere", "zh": "历史与看点"},
    "listen": {"en": "Listen in WalkBCN", "es": "Escúchala en WalkBCN", "ca": "Escolta-la a WalkBCN", "fr": "L’écouter dans WalkBCN", "de": "In WalkBCN anhören", "it": "Ascoltala su WalkBCN", "zh": "在 WalkBCN 中收听"},
    "listenSub": {"en": "Free audio story, no account", "es": "Historia en audio gratis, sin registro", "ca": "Història en àudio gratis, sense registre", "fr": "Histoire audio gratuite, sans compte", "de": "Kostenlose Audiogeschichte, ohne Konto", "it": "Storia audio gratuita, senza account", "zh": "免费音频故事，无需注册"},
    "near": {"en": "Nearby stops", "es": "Paradas cerca", "ca": "Parades a prop", "fr": "Arrêts à proximité", "de": "Stopps in der Nähe", "it": "Tappe vicine", "zh": "附近站点"},
    "walk": {"en": "min walk", "es": "min a pie", "ca": "min a peu", "fr": "min à pied", "de": "Min. zu Fuß", "it": "min a piedi", "zh": "分钟步行"},
    "all": {"en": "All stops", "es": "Todas las paradas", "ca": "Totes les parades", "fr": "Tous les arrêts", "de": "Alle Stopps", "it": "Tutte le tappe", "zh": "全部站点"},
    "plan": {"en": "Plan a walk with these stops", "es": "Planea un paseo con estas paradas", "ca": "Planeja un passeig amb aquestes parades", "fr": "Prévoir une balade avec ces arrêts", "de": "Einen Spaziergang mit diesen Stopps planen", "it": "Pianifica una passeggiata con queste tappe", "zh": "用这些站点规划步行路线"},
    "tagline": {"en": "Free audio walks in Barcelona", "es": "Paseos con audio gratis por Barcelona", "ca": "Passejades amb àudio gratis per Barcelona", "fr": "Balades audio gratuites à Barcelone", "de": "Kostenlose Audio-Spaziergänge in Barcelona", "it": "Passeggiate audio gratuite a Barcellona", "zh": "巴塞罗那免费语音步行游"},
    "listIntro": {"en": "{n} places in central Barcelona and Poblenou–Clot, each with its own story. Read it here, or listen to it in the app when you are there.",
                  "es": "{n} lugares del centro de Barcelona y el Poblenou–Clot, cada uno con su historia. Léela aquí o escúchala en la app cuando estés allí.",
                  "ca": "{n} llocs del centre de Barcelona i el Poblenou–Clot, cadascun amb la seva història. Llegeix-la aquí o escolta-la a l’app quan hi siguis.",
                  "fr": "{n} lieux du centre de Barcelone et du Poblenou–Clot, chacun avec son histoire. Lisez-la ici, ou écoutez-la dans l’app sur place.",
                  "de": "{n} Orte im Zentrum von Barcelona und in Poblenou–Clot, jeder mit seiner Geschichte. Hier lesen oder vor Ort in der App anhören.",
                  "it": "{n} luoghi del centro di Barcellona e del Poblenou–Clot, ognuno con la sua storia. Leggila qui o ascoltala nell’app quando sei lì.",
                  "zh": "巴塞罗那市中心和 Poblenou–Clot 的 {n} 个地点，每处都有自己的故事。可以在这里阅读，到了现场再在应用里收听。"},
    "routes": {"en": "Suggested walks", "es": "Rutas sugeridas", "ca": "Rutes suggerides", "fr": "Balades suggérées", "de": "Vorgeschlagene Spaziergänge", "it": "Passeggiate suggerite", "zh": "推荐路线"},
    "routeStops": {"en": "Stops on this walk", "es": "Paradas de esta ruta", "ca": "Parades d’aquesta ruta", "fr": "Les arrêts de cette balade", "de": "Stopps auf diesem Spaziergang", "it": "Le tappe di questa passeggiata", "zh": "这条路线的站点"},
    "routePick": {"en": "The app picks the order, and how many of these stops fit, from your time and starting point.",
                  "es": "La app elige el orden y cuántas de estas paradas caben según tu tiempo y desde dónde sales.",
                  "ca": "L’app tria l’ordre i quantes d’aquestes parades hi caben segons el teu temps i des d’on surts.",
                  "fr": "L’app choisit l’ordre, et combien de ces arrêts tiennent, selon ton temps et ton point de départ.",
                  "de": "Die App wählt die Reihenfolge und wie viele dieser Stopps passen, je nach Zeit und Startpunkt.",
                  "it": "L’app sceglie l’ordine, e quante di queste tappe ci stanno, in base al tuo tempo e al punto di partenza.",
                  "zh": "应用会根据你的时间和出发点，决定顺序以及能走其中多少个站点。"},
    "routeStart": {"en": "Start this walk in WalkBCN", "es": "Empieza esta ruta en WalkBCN", "ca": "Comença aquesta ruta a WalkBCN", "fr": "Commencer cette balade dans WalkBCN", "de": "Diesen Spaziergang in WalkBCN starten", "it": "Inizia questa passeggiata su WalkBCN", "zh": "在 WalkBCN 中开始这条路线"},
    "routeSub": {"en": "Free, no account, an audio story at every stop", "es": "Gratis, sin registro, con una historia en audio en cada parada", "ca": "Gratis, sense registre, amb una història en àudio a cada parada", "fr": "Gratuit, sans compte, une histoire audio à chaque arrêt", "de": "Kostenlos, ohne Konto, an jedem Stopp eine Audiogeschichte", "it": "Gratis, senza account, una storia audio a ogni tappa", "zh": "免费，无需注册，每个站点都有音频故事"},
    "onRoutes": {"en": "On these walks", "es": "En estas rutas", "ca": "En aquestes rutes", "fr": "Dans ces balades", "de": "Auf diesen Spaziergängen", "it": "In queste passeggiate", "zh": "所在路线"},
    "walkTail": {"en": "walking route", "es": "ruta a pie", "ca": "ruta a peu", "fr": "balade à pied", "de": "Spaziergang", "it": "percorso a piedi", "zh": "步行路线"},
    "walkWord": {"en": "Walk", "es": "Ruta", "ca": "Ruta", "fr": "Balade", "de": "Spaziergang", "it": "Passeggiata", "zh": "路线"},
    "areaWord": {"en": "Neighbourhood", "es": "Barrio", "ca": "Barri", "fr": "Quartier", "de": "Viertel", "it": "Quartiere", "zh": "街区"},
}
LANG_NAME = {"en": "English", "es": "Español", "ca": "Català", "fr": "Français", "de": "Deutsch", "it": "Italiano", "zh": "中文"}
OG_LOCALE = {"en": "en_GB", "es": "es_ES", "ca": "ca_ES", "fr": "fr_FR", "de": "de_DE", "it": "it_IT", "zh": "zh_CN"}

JXA = r"""
ObjC.import('Foundation');
function read(p){ var s = $.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null); if (!s) throw new Error('cannot read ' + p); return s.js; }
var window = {};
['data/stops.js', 'data/cards.js', 'data/ui.js'].forEach(function (f) { eval(read(f)); });
var THEMES = {};
/*THEMES*/
JSON.stringify({ stops: window.WALKBCN_STOPS, cards: window.WALKBCN_CARDS || {}, photos: window.WALKBCN_PHOTOS || {}, ui: window.WALKBCN_UI, themes: THEMES });
"""


def themes_source():
    """The app's suggested walks (const THEMES in index.html), as JavaScript source."""
    src = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    start = src.find("const THEMES = {")
    if start < 0:
        return ""
    end = src.find("\n};", start)
    return "THEMES = " + src[start + len("const THEMES = "):end + 2] + ";"


def load_js_data():
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(JXA.replace("/*THEMES*/", themes_source()))
        tmp = f.name
    try:
        out = subprocess.run(["osascript", "-l", "JavaScript", tmp], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    finally:
        os.remove(tmp)
    return json.loads(out)


def esc(s):
    return html.escape(s or "", quote=True)


def photo(file, w=960):
    from urllib.parse import quote
    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(file)}?width={w}"


def commons_page(file):
    from urllib.parse import quote
    return f"https://commons.wikimedia.org/wiki/File:{quote(file.replace(' ', '_'))}"


def metres(a, b):
    R = 6371000
    p1, p2 = math.radians(a["lat"]), math.radians(b["lat"])
    dp, dl = p2 - p1, math.radians(b["lng"] - a["lng"])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def describe(text, n=155):
    text = re.sub(r"\s+", " ", text or "").strip()
    if len(text) <= n:
        return text
    cut = text[:n]
    stop = max(cut.rfind(". "), cut.rfind("。"))
    if stop > 80:
        return cut[: stop + 1]
    return cut[: cut.rfind(" ")].rstrip(",;:") + "…" if " " in cut else cut + "…"


def paragraphs(text):
    parts = [p.strip() for p in re.split(r"\n\s*\n|\n", text or "") if p.strip()]
    return "".join(f"<p>{esc(p)}</p>" for p in parts)


def area_name(a, lang):
    return "Barri Gòtic" if lang != "en" and a == "Gothic Quarter" else a


CSS = """
:root{--bg:#f2f5f7;--panel:#fff;--ink:#0a1a5e;--muted:#4f6274;--line:#cdd8dd;--accent:#0026b8;--sun:#f5c000;
--display:'Gloock','Bodoni 72',Didot,Georgia,serif;--sans:'Commissioner','Gill Sans',system-ui,sans-serif}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 var(--sans)}
a{color:var(--accent)}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;max-width:760px;margin:0 auto;padding:18px 16px}
.brand{font:400 1.6rem/1 var(--display);text-decoration:none;color:var(--ink)}.brand b{color:var(--accent);font-weight:400}
.tag{font-size:.85rem;color:var(--muted)}
main{max-width:760px;margin:0 auto;padding:0 16px 48px;display:grid;gap:22px}
h1{font:400 clamp(2rem,6vw,2.8rem)/1.12 var(--display);margin:6px 0 0;text-wrap:balance}
h2{font:400 1.45rem/1.2 var(--display);margin:0}
.area{color:var(--muted);font-size:.95rem}
figure{margin:0}figure img{width:100%;max-height:460px;object-fit:cover;border-radius:12px;display:block;background:var(--line)}
figcaption{font-size:.8rem;color:var(--muted);margin-top:6px}
.story p{margin:0 0 1em;max-width:65ch}
.cta{display:flex;flex-direction:column;gap:2px;align-self:start;background:var(--accent);color:#fff;text-decoration:none;padding:14px 22px;border-radius:14px;font-weight:600;font-size:1.05rem;width:fit-content}
.cta span{font-weight:400;font-size:.85rem;opacity:.9}
.box{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px;display:grid;gap:10px}
.box dl{margin:0;display:grid;gap:10px}.box dt{font-weight:600}.box dd{margin:0}
.badges{display:flex;flex-wrap:wrap;gap:6px}.badges span{font-size:.82rem;background:var(--bg);border:1px solid var(--line);border-radius:99px;padding:3px 10px}
ul.near,ul.list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
ul.near li,ul.list li{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 14px}
ul.near small{color:var(--muted)}
.cols{display:grid;gap:22px}
footer{max-width:760px;margin:0 auto;padding:22px 16px 40px;border-top:1px solid var(--line);font-size:.85rem;color:var(--muted);display:grid;gap:10px}
.langs{display:flex;flex-wrap:wrap;gap:6px 14px}
"""
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Gloock&family=Commissioner:wght@400;600&display=swap" rel="stylesheet">'


def page(lang, title, desc, path, alternates, body, ld, image=None):
    alt = "".join(f'<link rel="alternate" hreflang="{l}" href="{BASE}{p}">' for l, p in alternates.items())
    alt += f'<link rel="alternate" hreflang="x-default" href="{BASE}{alternates.get("en", path)}">'
    img = image or f"{BASE}assets/icon-512.png"
    return f"""<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{BASE}{path}">
{alt}
<meta property="og:type" content="article">
<meta property="og:site_name" content="WalkBCN">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{BASE}{path}">
<meta property="og:image" content="{esc(img)}">
<meta property="og:locale" content="{OG_LOCALE[lang]}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0026b8">
<link rel="icon" href="{BASE}assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="{BASE}assets/icon-180.png">
{FONTS}
<style>{CSS}</style>
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head>
<body>
{body}
</body>
</html>
"""


def header(lang, ui):
    return f'<header class="top"><a class="brand" href="{BASE}">Walk<b>BCN</b></a><span class="tag">{esc(W["tagline"][lang])}</span></header>'


def footer(lang, ui, lang_links):
    links = " ".join(f'<a href="{BASE}{p}" hreflang="{l}" lang="{l}">{LANG_NAME[l]}</a>' for l, p in lang_links.items())
    return f'<footer><nav class="langs" aria-label="Language">{links}</nav><div>{esc(ui[lang].get("footer") or ui["en"]["footer"])}</div><div><a href="{BASE}{lang}/">{esc(W["all"][lang])}</a> · <a href="{BASE}">WalkBCN</a></div></footer>'


def main():
    d = load_js_data()
    stops, cards, photos, ui = d["stops"], d["cards"], d["photos"], d["ui"]
    i18n = {}
    for l in LANGS:
        f = os.path.join(ROOT, "content", "i18n", f"{l}.json")
        i18n[l] = json.load(open(f, encoding="utf-8")) if os.path.exists(f) else {"stops": {}}

    def text_for(s, l):
        local = i18n[l]["stops"].get(s["id"], {})
        base = (local.get("stories") or {}).get("base") or {}
        if l == "en":
            return base.get("long") or s["story"], base.get("normal") or s["story"], s.get("tip", "")
        if not base:
            return None
        return base.get("long") or base.get("normal"), base.get("normal") or base.get("long"), local.get("tip") or s.get("tip", "")

    def t(l, k, **kw):
        v = ui.get(l, {}).get(k) or ui["en"].get(k) or ""
        for a, b in kw.items():
            v = v.replace("{" + a + "}", b)
        return v

    # Clean out what an earlier run wrote, so a removed stop leaves no page behind.
    for l in LANGS:
        p = os.path.join(ROOT, l)
        if os.path.isdir(p) and os.path.exists(os.path.join(p, ".generated")):
            shutil.rmtree(p)

    urls = []  # (path, {lang: path})
    available = {s["id"]: [l for l in LANGS if text_for(s, l)] for s in stops}
    by_id = {s["id"]: s for s in stops}
    themes = {k: v for k, v in (d.get("themes") or {}).items() if ui["en"].get(f"theme_{k}")}
    on_themes = {}
    for tid, th in themes.items():
        for sid in th.get("pool", []):
            on_themes.setdefault(sid, []).append(tid)
    slug = lambda tid: re.sub(r"(?<!^)([A-Z])", r"-\1", tid).lower()  # firstDay -> first-day
    route_path = lambda l, tid: f"{l}/routes/{slug(tid)}/"

    def routes_links(l, ids):
        return "".join(f'<li><a href="{BASE}{route_path(l, tid)}">{esc(t(l, f"theme_{tid}"))}</a> <small>· {esc(t(l, f"theme_{tid}_sub"))}</small></li>' for tid in ids)

    for s in stops:
        langs = available[s["id"]]
        alts = {l: f"{l}/{s['id']}/" for l in langs}
        urls.append((alts.get("en") or next(iter(alts.values())), alts))
        near = sorted((x for x in stops if x["id"] != s["id"]), key=lambda x: metres(s, x))[:4]
        c = cards.get(s["id"], {})
        ph = photos.get(s.get("img"), {})
        for l in langs:
            long_text, normal, tip = text_for(s, l)
            path = alts[l]
            area = area_name(s["area"], l)
            title = f"{s['name']}: {W['titleTail'][l]} · WalkBCN"
            desc = describe(normal)
            pick = lambda o: (o or {}).get(l) or (o or {}).get("en") or ""
            badges = ([t(l, f"outside_{c['outside']}")] if c.get("outside") else []) + [t(l, f"sens_{k}") for k in c.get("sensitive", [])]
            rows = [(t(l, k), pick(c.get(f))) for k, f in (("lookTitle", "look"), ("listenTitle", "listen"), ("accessTitle", "access")) if pick(c.get(f))]
            credit = t(l, "photoBy", author=ph.get("author", ""), licence=ph.get("licence", "")) if ph else ""
            caption = ""
            if credit:
                lic = f' · <a href="{esc(ph["licenceUrl"])}" rel="noopener license">{esc(t(l, "licenceLink"))}</a>' if ph.get("licenceUrl") else ""
                caption = f'<figcaption><a href="{esc(commons_page(s["img"]))}" rel="noopener">{esc(credit)}</a>{lic}</figcaption>'
            app_link = f"{BASE}#stop={s['id']}&lang={l}"
            near_html = "".join(
                f'<li><a href="{BASE}{l}/{x["id"]}/">{esc(x["name"])}</a> <small>· {esc(area_name(x["area"], l))} · {max(1, round(metres(s, x) / 75))} {W["walk"][l]}</small></li>'
                for x in near if l in available[x["id"]])
            practical = ""
            if badges or rows or c.get("official"):
                practical = '<section class="box">' + (f'<div class="badges">{"".join(f"<span>{esc(b)}</span>" for b in badges)}</div>' if badges else "")
                practical += ("<dl>" + "".join(f"<div><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>" for k, v in rows) + "</dl>") if rows else ""
                practical += f'<div><a href="{esc(c["official"])}" rel="noopener">{esc(t(l, "officialLink"))} ↗</a></div>' if c.get("official") else ""
                practical += "</section>"
            body = header(l, ui) + f"""
<main>
  <div><div class="area">{esc(W['areaWord'][l])}: {esc(area)}</div><h1>{esc(s['name'])}</h1></div>
  <figure><img src="{esc(photo(s['img'], 960))}" srcset="{esc(photo(s['img'], 500))} 500w, {esc(photo(s['img'], 960))} 960w" sizes="(max-width: 760px) 100vw, 728px" alt="{esc(s['name'])}" width="960" height="640">
    {caption}
  </figure>
  <a class="cta" href="{esc(app_link)}">▶ {esc(W['listen'][l])}<span>{esc(W['listenSub'][l])}</span></a>
  <article class="story">{paragraphs(long_text)}</article>
  {f'<section class="box"><div><b>{esc(t(l, "tip"))}</b> {esc(tip)}</div></section>' if tip else ''}
  {practical}
  {f'<section class="cols"><h2>{esc(W["onRoutes"][l])}</h2><ul class="near">{routes_links(l, on_themes[s["id"]])}</ul></section>' if on_themes.get(s["id"]) else ''}
  {f'<section class="cols"><h2>{esc(W["near"][l])}</h2><ul class="near">{near_html}</ul></section>' if near_html else ''}
</main>
""" + footer(l, ui, alts)
            ld = {"@context": "https://schema.org", "@type": "TouristAttraction", "name": s["name"], "description": desc,
                  "url": f"{BASE}{path}", "inLanguage": l, "image": photo(s["img"], 960),
                  "geo": {"@type": "GeoCoordinates", "latitude": s["lat"], "longitude": s["lng"]},
                  "containedInPlace": {"@type": "Place", "name": f"{s['area']}, Barcelona"},
                  "isPartOf": {"@type": "WebSite", "name": "WalkBCN", "url": BASE}}
            if c.get("official"):
                ld["sameAs"] = c["official"]
            out = os.path.join(ROOT, path, "index.html")
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with open(out, "w", encoding="utf-8") as f:
                f.write(page(l, title, desc, path, alts, body, ld, photo(s["img"], 1200)))

    # One page per suggested walk and language.
    for tid, th in themes.items():
        alts = {l: route_path(l, tid) for l in LANGS}
        urls.append((alts["en"], alts))
        pool = [by_id[i] for i in th.get("pool", []) if i in by_id]
        for l in LANGS:
            name, sub, cover = t(l, f"theme_{tid}"), t(l, f"theme_{tid}_sub"), t(l, f"theme_{tid}_cover")
            items = ""
            for s in pool:
                if l not in available[s["id"]]:
                    continue
                summary = describe(text_for(s, l)[1], 140)
                items += f'<li><a href="{BASE}{l}/{s["id"]}/"><b>{esc(s["name"])}</b></a> <small>· {esc(area_name(s["area"], l))}</small><br>{esc(summary)}</li>'
            pick = "" if th.get("mode") == "stops" and th.get("n") == len(pool) else f'<p class="area">{esc(W["routePick"][l])}</p>'
            others = [x for x in themes if x != tid]
            app_link = f"{BASE}#theme={tid}&lang={l}"
            body = header(l, ui) + f"""
<main>
  <div><div class="area">{esc(W['walkWord'][l])} · {esc(sub)}</div><h1>{esc(name)}</h1></div>
  <figure><img src="{esc(photo(th['img'], 960))}" srcset="{esc(photo(th['img'], 500))} 500w, {esc(photo(th['img'], 960))} 960w" sizes="(max-width: 760px) 100vw, 728px" alt="{esc(name)}" width="960" height="640"></figure>
  <p>{esc(cover)}</p>
  <a class="cta" href="{esc(app_link)}">▶ {esc(W['routeStart'][l])}<span>{esc(W['routeSub'][l])}</span></a>
  <section class="cols"><h2>{esc(W['routeStops'][l])}</h2>{pick}<ul class="list">{items}</ul></section>
  <section class="cols"><h2>{esc(W['routes'][l])}</h2><ul class="near">{routes_links(l, others)}</ul></section>
</main>
""" + footer(l, ui, alts)
            desc = describe(f"{sub}. {cover}")
            ld = {"@context": "https://schema.org", "@type": "TouristTrip", "name": name, "description": desc, "url": f"{BASE}{route_path(l, tid)}",
                  "inLanguage": l, "image": photo(th["img"], 960), "isAccessibleForFree": True,
                  "itinerary": {"@type": "ItemList", "itemListElement": [
                      {"@type": "ListItem", "position": i + 1, "item": {"@type": "TouristAttraction", "name": s["name"], "url": f"{BASE}{l}/{s['id']}/"}}
                      for i, s in enumerate(pool)]},
                  "isPartOf": {"@type": "WebSite", "name": "WalkBCN", "url": BASE}}
            out = os.path.join(ROOT, route_path(l, tid), "index.html")
            os.makedirs(os.path.dirname(out), exist_ok=True)
            with open(out, "w", encoding="utf-8") as f:
                f.write(page(l, f"{name}: {W['walkTail'][l]} · WalkBCN", desc, route_path(l, tid), alts, body, ld, photo(th["img"], 1200)))

    # One list per language, by neighbourhood.
    list_alts = {l: f"{l}/" for l in LANGS}
    for l in LANGS:
        mine = [s for s in stops if l in available[s["id"]]]
        groups = {}
        for s in mine:
            groups.setdefault(area_name(s["area"], l), []).append(s)
        sections = "".join(
            f'<section class="cols"><h2>{esc(a)}</h2><ul class="list">' + "".join(
                f'<li><a href="{BASE}{l}/{s["id"]}/">{esc(s["name"])}</a></li>' for s in sorted(g, key=lambda x: x["name"])) + "</ul></section>"
            for a, g in sorted(groups.items(), key=lambda kv: (-len(kv[1]), kv[0])))
        intro = W["listIntro"][l].replace("{n}", str(len(mine)))
        body = header(l, ui) + f"""
<main>
  <h1>{esc(W['all'][l])}</h1>
  <p>{esc(intro)}</p>
  <a class="cta" href="{BASE}">{esc(W['plan'][l])}<span>{esc(W['listenSub'][l])}</span></a>
  {f'<section class="cols"><h2>{esc(W["routes"][l])}</h2><ul class="near">{routes_links(l, themes)}</ul></section>' if themes else ''}
  {sections}
</main>
""" + footer(l, ui, list_alts)
        ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": f"WalkBCN · {W['all'][l]}", "url": f"{BASE}{l}/", "inLanguage": l,
              "isPartOf": {"@type": "WebSite", "name": "WalkBCN", "url": BASE}}
        with open(os.path.join(ROOT, l, "index.html"), "w", encoding="utf-8") as f:
            f.write(page(l, f"{W['all'][l]} · {W['tagline'][l]} · WalkBCN", intro, f"{l}/", list_alts, body, ld))
        open(os.path.join(ROOT, l, ".generated"), "w").write("Written by scripts/build-pages.py. Do not edit by hand: run the script again.\n")
    urls.insert(0, ("en/", list_alts))

    # sitemap.xml with every address and its languages.
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
          f"  <url><loc>{BASE}</loc><lastmod>{TODAY}</lastmod></url>"]
    for _, alts in urls:
        for l, p in alts.items():
            sm.append(f"  <url><loc>{BASE}{p}</loc><lastmod>{TODAY}</lastmod>" + "".join(
                f'<xhtml:link rel="alternate" hreflang="{l2}" href="{BASE}{p2}"/>' for l2, p2 in alts.items()) + "</url>")
    sm.append("</urlset>")
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(sm) + "\n")

    # robots.txt is only read at the root of a domain (not inside msalag67.github.io/walkbcn/),
    # so it starts working once WalkBCN has its own domain. Until then, send the sitemap in
    # Google Search Console.
    open(os.path.join(ROOT, "robots.txt"), "w").write(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}sitemap.xml\n")

    areas = sorted({s["area"] for s in stops})
    llms = f"""# WalkBCN

> Free audio walks in Barcelona. Pick what you like and WalkBCN builds a short walking route through the city centre and Poblenou–Clot, with an audio story at every stop.

- Free, no account, no ads. Nobody pays to appear.
- {len(stops)} stops, each with its own story.
- Stories in 7 languages: English, Spanish, Catalan, French, German, Italian and Chinese.
- Walks from 30 minutes to 3 hours, planned by stops, time or distance.
- Interests: architecture, history, food and markets, art, local life, parks and sea, sports, film, books and theatre.
- Audio guide: a map of all stops; tap one to hear its story, or let it show the nearest.
- Works offline once a walk is saved.
- Restaurants and places recommended are local, family-run or independent.
- Made by two students from Barcelona. Still in development.

## Areas

{", ".join(areas)}.

## Pages

- App: {BASE}
- All stops, one page each with its story: {BASE}en/ (also {", ".join(f"{BASE}{l}/" for l in LANGS if l != "en")})
- Suggested walks: {"; ".join(f"{ui['en'][f'theme_{tid}']} ({BASE}{route_path('en', tid)})" for tid in themes)}
- Contact: the form in "About WalkBCN" inside the app.
"""
    open(os.path.join(ROOT, "llms.txt"), "w", encoding="utf-8").write(llms)

    # The app's own head and footer.
    idx_file = os.path.join(ROOT, "index.html")
    idx = open(idx_file, encoding="utf-8").read()
    ld = {"@context": "https://schema.org", "@type": "WebApplication", "name": "WalkBCN", "url": BASE,
          "description": f"Personal walking routes through central Barcelona and Poblenou–Clot, built from your interests, with an audio story at each of {len(stops)} stops.",
          "applicationCategory": "TravelApplication", "operatingSystem": "Any (web browser)", "isAccessibleForFree": True,
          "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}, "inLanguage": LANGS,
          "areaServed": {"@type": "City", "name": "Barcelona"}}
    hero = next((s for s in stops if s["id"] == "sagrada-familia"), stops[0])
    head = f"""<!-- seo:start · written by scripts/build-pages.py -->
<meta name="description" content="Pick what you like and get a short walking route through central Barcelona, with an audio story at every stop. Free, no account, 7 languages.">
<link rel="canonical" href="{BASE}">
<link rel="sitemap" type="application/xml" href="{BASE}sitemap.xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="WalkBCN">
<meta property="og:title" content="WalkBCN · Free audio walks in Barcelona">
<meta property="og:description" content="A short walking route built from your interests, with an audio story at every stop. Free, no account.">
<meta property="og:url" content="{BASE}">
<meta property="og:image" content="{esc(photo(hero['img'], 1200))}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<!-- seo:end -->"""
    if "<!-- seo:start" in idx:
        idx = re.sub(r"<!-- seo:start.*?<!-- seo:end -->", lambda m: head, idx, flags=re.S)
    else:
        idx = idx.replace("<title>WalkBCN</title>", "<title>WalkBCN · Free audio walks in Barcelona</title>\n" + head, 1)
    link = '<!-- stops:start --> · <a href="en/" data-stops-link>All stops</a><!-- stops:end -->'
    if "<!-- stops:start" in idx:
        idx = re.sub(r"<!-- stops:start -->.*?<!-- stops:end -->", lambda m: link, idx, flags=re.S)
    else:
        idx = idx.replace('data-i18n="privacyLink">Your data &amp; privacy</button></footer>',
                          'data-i18n="privacyLink">Your data &amp; privacy</button>' + link + "</footer>", 1)
    open(idx_file, "w", encoding="utf-8").write(idx)

    total = sum(len(a) for _, a in urls)
    n_routes = len(themes) * len(LANGS)
    print(f"Wrote {total - len(LANGS) - n_routes} stop pages, {n_routes} walk pages, {len(LANGS)} stop lists, sitemap.xml ({total + 1} addresses), robots.txt, llms.txt; updated index.html. Base: {BASE}")


if __name__ == "__main__":
    main()
