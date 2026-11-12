# Portfolio – Mahsa Shariati Najafabadi

Persönliche Portfolio-Website (statisch, ohne Build-Schritt): HTML, CSS und etwas Vanilla-JavaScript.

- Zweisprachig (Deutsch / Englisch), Umschalter oben rechts
- Hell- und Dunkelmodus, respektiert `prefers-color-scheme` und `prefers-reduced-motion`
- Schriften lokal eingebunden (Fraunces, Inter Tight, JetBrains Mono – SIL Open Font License), keine externen Requests

## Lokal ansehen

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen.

## Veröffentlichen mit GitHub Pages

Repository → *Settings* → *Pages* → *Deploy from a branch* → Branch `main`, Ordner `/ (root)`.
