# EDGE® sajt

Statičan sajt, bez biblioteka i bez build koraka: čist HTML, CSS i JavaScript.

## Struktura

| Fajl / folder | Šta je |
|---|---|
| `index.html` | Sav sadržaj sajta. |
| `css/style.css` | Stilovi, pisani od telefona naviše: telefon → tablet (768px) → desktop (1024px+). |
| `js/main.js` | Meni, slajderi, skrol animacije i harmonika. |
| `fonts/` | Archivo i JetBrains Mono (latinica i latin-ext za č, ć, đ, š, ž). |

## Skaliranje

Sve mere su u `rem`, a 1rem odgovara 10px dizajna. Na desktopu je 1rem = širina prozora / 144,
pa sajt na 1440px izgleda tačno kao dizajn, a na 1920px je sve 1,33× veće. Skaliranje zavisi
samo od širine prozora, zato sajt izgleda isto u običnom prozoru i na full screen-u.

## Slike

Fotografije su u `img/` kao WebP u više širina (400–2000px), npr. `proj-03-960.webp`.
Browser sam bira veličinu prema ekranu (`srcset`/`sizes`): telefon skida male verzije, a veliki monitor velike.
Sve slike osim prve u heru učitavaju se tek kad se korisnik približi tom delu stranice.
Ista fotografija korišćena na dva mesta ima jedan set fajlova.

Kadriranje pojedinih slika (koji deo fotografije se vidi) podešeno je sa `object-position`
direktno na slici, npr. vile u heru su spuštene da se vidi krov.

Isti portret je na svih 5 izjava klijenata.

Sekcija Proces: četiri koraka (broj, naslov, opis, slika) koji se pri skrolu slažu jedan preko drugog
(CSS `position: sticky`); od prethodnih koraka ostaje vidljiv samo gornji deo (`--strip` u CSS-u),
a linija na vrhu koraka se puni dok korak dolazi na svoje mesto. Slike koraka su postojeće slike sa sajta.

## After footer

Traka ispod podnožja (`.after`): © i „Sva prava zadržana", linkovi Uslovi korišćenja / Politika privatnosti / Kolačići
(za sada `href="#"` — kad stranice postoje, samo zameniti adrese), sve centrirano.

## Motion

Svi pokreti koriste iste dve krive iz dizajna: `--E` za „brisanja" i `--O` za pomeranja.

- **Dugmad:** po uzoru na veliki CTA u podnožju, sloj u obrnutim bojama se „prebriše" sleva, a strelica izađe i uđe ponovo. Sloj pravi `main.js`, a stil je u `.fx` u CSS-u.
- **Linkovi:** linija se piše sleva i izlazi nadesno.
- **Meni:** kad je kursor na jednom linku, ostali se priguše.
- **Header:** uvek prati skrol (fiksiran na vrhu), bez pozadine; logo vodi na početnu stranicu.
- **Naslovi:** pri skrolu se otkrivaju red po red, a tekst i blokovi blago odozdo (lista `REVEAL` u `main.js`).
- **Pinovane sekcije:** blago „dostižu" poziciju skrola (`SMOOTH` u `main.js`; vrednost 1 isključuje uglađivanje).
- **Brojači:** „okreću" se pri promeni vrednosti, a krug „Pogledajte projekat" se privlači ka kursoru.
- **Smanjeno kretanje:** ako korisnik u sistemu uključi opciju za smanjeno kretanje, sve animacije su isključene.

## Postavljanje na GitHub Pages

1. Ubacite sadržaj ovog foldera (`index.html`, `css/`, `js/`, `fonts/`, `.nojekyll`) u root GitHub repozitorijuma.
2. Settings → Pages → Deploy from a branch → main / (root) → Save.
3. Sajt je na https://<korisnik>.github.io/<repozitorijum>/

Originalni izvoz iz Claude Design-a sačuvan je u folderu `EDGE GitHub - original (rezerva)` na Desktopu.
