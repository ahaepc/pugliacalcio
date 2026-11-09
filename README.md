# Puglia Calcio

Hemmamatcher i Serie A–D för lag från Puglia, med avstånd och restid från Ceglie Messapica. Svenska, italienska och engelska.

- `web/` – själva webbsidan. Laddas upp i en mapp på webbhotellet.
- `data/` – den data sidan läser: `matches.json`, `venues.json` och `site.json` (översättningar, fliken Om datan och datum för senaste uppdatering). Uppdateras varje måndag.
- `tools/check_texts.py` – kontrollerar att alla datatexter har italiensk och engelsk översättning.

Sidan hämtar datan från `https://raw.githubusercontent.com/ahaepc/pugliacalcio/main/data/` och använder kopian i `web/data/` om det inte går.
Kontrollera alltid klubbens egen sida före resan.
