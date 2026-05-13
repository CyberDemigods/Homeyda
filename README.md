# Homeyda — Maison de Pâtisserie

Website for **Homeyda**, a custom cake atelier in Shiraz, Iran — bento cakes, birthday cakes, and bespoke creations from Anahita's hands.

## Live preview

- Production preview: GitHub Pages (see Pages settings)
- Instagram: [@homeyda](https://www.instagram.com/homeyda/)

## Stack

- Vanilla HTML / CSS / JavaScript (no build step)
- Two languages: Farsi (RTL) primary, English (LTR) secondary
- Static site, deployable anywhere
- Bilingual blog with 6 articles (`/blog/`)
- Schema.org Bakery + BlogPosting structured data

## Structure

```
.
|-- index.html             # main page
|-- blog/                  # journal (FA + EN)
|   |-- index.html         # post list
|   |-- yalda-cake-shiraz.html
|   |-- shiraz-city-of-sweets.html
|   |-- fondant-toppers-craft.html
|   |-- vintage-cakes-trend.html
|   |-- mothers-day-cake.html
|   `-- bento-cake-love-for-two.html
|-- css/style.css
|-- js/main.js
|-- js/translations.js
|-- assets/images/         # logo, anahita portrait, gallery
|-- logo.png
|-- favicon.svg
|-- og-image.svg
|-- robots.txt
|-- sitemap.xml
`-- site.webmanifest
```

## Local preview

Any static server works. With Python:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Credits

Forged by [CyberDemigods](https://cyberdemigods.com).
