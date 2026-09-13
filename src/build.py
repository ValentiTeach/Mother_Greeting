#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Збирає самодостатній index.html з окремих джерел.

    python3 src/build.py

Джерела:
    src/fonts.css  — вбудовані шрифти Cormorant Garamond + Manrope (base64)
    src/app.css    — стилі осінньої розгортки
    src/body.html  — розмітка (__PHOTO__ підставляється автоматично)
    src/app.js     — інтерактив: навігація, 3D-кнопки, листопад, теми
    Photo/photo    — фотографія мами (JPEG), вбудовується як data URI

Результат — один файл index.html, що працює навіть без інтернету.
"""
import base64
import io
import os
import urllib.parse

SRC = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SRC)
OUT = os.path.join(ROOT, "index.html")


def read(name):
    with io.open(os.path.join(SRC, name), encoding="utf-8") as fh:
        return fh.read()


def photo_data_uri():
    path = os.path.join(ROOT, "Photo", "photo")
    with open(path, "rb") as fh:
        raw = fh.read()
    return "data:image/jpeg;base64," + base64.b64encode(raw).decode("ascii")


MAPLE = (
    "M12 1.8c.5 1.6 1 3 1.9 4.3.7-.3 1.5-.7 2.3-1.2-.2 1.1-.4 2-.7 2.9 1.3-.2 2.6-.6 3.9-1.1"
    "-.5 1-1 1.9-1.6 2.7.5.3 1.1.5 1.8.7-1.5 1.1-3 2-4.6 2.7 1.4.6 3 1 4.7 1.2-.7.6-1.3 1.1-2 1.5"
    ".2.5.5 1 .9 1.5-1.9-.1-3.6-.4-5.2-.9.1 1.4.3 2.9.7 4.4-.9-.6-1.7-1.3-2.4-2-.6.7-1.4 1.4-2.3 2"
    ".4-1.5.6-3 .7-4.4-1.6.5-3.3.8-5.2.9.4-.5.7-1 .9-1.5-.7-.4-1.3-.9-2-1.5 1.7-.2 3.3-.6 4.7-1.2"
    "-1.6-.7-3.1-1.6-4.6-2.7.7-.2 1.3-.4 1.8-.7-.6-.8-1.1-1.7-1.6-2.7 1.3.5 2.6.9 3.9 1.1-.3-.9-.5-1.8-.7-2.9"
    ".8.5 1.6.9 2.3 1.2.9-1.3 1.4-2.7 1.9-4.3Z"
)

FAVICON = "data:image/svg+xml," + urllib.parse.quote(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>"
    "<rect width='24' height='24' rx='5' fill='#f4e3c4'/>"
    "<path fill='#b8531d' d='" + MAPLE + "'/></svg>",
    safe="/:=,'",
)

TEMPLATE = u"""<!doctype html>
<html lang="uk" data-theme="day">
<head>
<meta charset="utf-8">
<title>Мамо, це тобі — осіння привітальна розгортка</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Тепле осіннє привітання для мами: я тебе дуже люблю і завжди любитиму, ми цінуємо твої старання, і в тебе все вийде.">
<meta name="author" content="Син">
<meta name="theme-color" content="#f4e3c4" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#150e08" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:title" content="Мамо, це тобі">
<meta property="og:description" content="Осіння привітальна розгортка: любов, вдячність і віра в тебе.">
<link rel="icon" href="%(favicon)s">

<!-- ─── Шрифти (вбудовані, працюють без інтернету) ─── -->
<style>
%(fonts)s
</style>

<!-- ─── Стилі розгортки ─── -->
<style>
%(css)s
</style>

<!-- ─── Якщо JavaScript вимкнено: лист усе одно читається ─── -->
<noscript><style>
  .cover, .controls, .utility, .progress__bar{display:none !important}
  .spread-wrap{position:relative !important}
  .spread{opacity:1 !important;visibility:visible !important;transform:none !important}
  .reader{min-height:0;perspective:none}
  .chapter{position:relative !important;inset:auto !important;opacity:1 !important;
    visibility:visible !important;transform:none !important;pointer-events:auto !important;
    padding-bottom:26px;margin-bottom:26px;border-bottom:1px solid var(--line)}
  .chapter:last-child{border-bottom:0}
  .chapter__body p, .quote, .sign{opacity:1 !important;transform:none !important}
  .chapter h2 .w > span{transform:none !important}
</style></noscript>
</head>
<body>
%(body)s
<script>
%(js)s
</script>
</body>
</html>
"""


def main():
    body = read("body.html").replace("__PHOTO__", photo_data_uri())
    assert "__PHOTO__" not in body, "фото не підставилося"
    html = TEMPLATE % dict(
        favicon=FAVICON,
        fonts=read("fonts.css"),
        css=read("app.css"),
        body=body,
        js=read("app.js"),
    )
    with io.open(OUT, "w", encoding="utf-8") as fh:
        fh.write(html)
    print("Готово: %s (%.0f КБ)" % (OUT, len(html.encode("utf-8")) / 1024.0))


if __name__ == "__main__":
    main()
