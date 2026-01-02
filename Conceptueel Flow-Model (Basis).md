## Conceptueel Flow-Model (Basis)

### Doel van de app

De app is bedoeld om **logistieke flows en bewegingen visueel uit te leggen**, niet om processen te simuleren of te optimaliseren.

De focus ligt op:

- begrip creëren
- gesprekken ondersteunen
- concepten, keuzes en situaties inzichtelijk maken

De app rekent **niet** naar waarheid, maar **visualiseert een verhaal**.

---

## Kernprincipe

Een *flow* in deze app is geen proces, simulatie of berekening.

> Een flow is een bewegend object dat zich volgens vooraf bepaalde regels verplaatst over een vast 2D-grid, om een logistiek concept of situatie uit te leggen.
> 

---

## De 4 fundamentele bouwstenen

### 1. Grid (de wereld)

- Vast 2D bovenaanzicht
- Bestaat uit vierkante cellen met vaste afmetingen (bijv. 0,5 m of 1 m)
- Alleen orthogonale bewegingen (Manhattan distance)
- Geen diagonalen
- Geen intelligentie of dynamiek

**Rol:**

Het grid vormt de absolute ruimtelijke waarheid van de visualisatie.

Alle beweging, afstand en tijd is hier direct aan gekoppeld.

---

### 2. Object (wat beweegt)

- Abstract logistiek object
- Gerepresenteerd als een eenvoudig blokje
- Kan eigenschappen hebben zoals:
    - kleur
    - label
    - type (optioneel, puur visueel)

**Belangrijk:**

Het object staat bewust niet voor een exacte entiteit (pallet, order, orderregel), maar voor “datgene wat beweegt” in het verhaal.

---

### 3. Pad (waarover het object beweegt)

- Een expliciet gedefinieerde reeks grid-coördinaten
- Bestaat uit:
    - startpunt
    - eventuele tussenpunten
    - eindpunt
- Geen pathfinding
- Geen automatische routebepaling

**Rol:**

Het pad is een bewuste keuze van de gebruiker en bepaalt het narratief.

De app volgt het pad, maar interpreteert het niet.

---

### 4. Tempo (hoe snel het beweegt)

- Vast tempo per flow of per type MHE
- Uitgedrukt in tijd per grid-cel (bijv. seconden per cel)
- Puur illustratief, niet bedoeld als prestatienorm

**Rol:**

Tempo geeft betekenis aan beweging en maakt verschillen visueel voelbaar, niet exact meetbaar.

---

## Definitie van een Flow

Een flow bestaat uit exact drie elementen:

> Flow = Object + Pad + Tempo
> 

Alles wat daarbuiten valt is afgeleid of optioneel.

---

## Afgeleide eigenschappen (geen kernlogica)

Op basis van het flow-model kunnen eenvoudig afgeleide metrics worden getoond:

- Afstand = aantal grid-cellen × celgrootte
- Doorlooptijd = afstand × tempo

Deze metrics zijn:

- indicatief
- bedoeld voor vergelijking
- ondersteunend aan het verhaal

---

## Bewuste afbakening (niet inbegrepen)

De app bevat expliciet **geen**:

- simulatie-logica
- optimalisatie-algoritmes
- resource-beperkingen
- wachttijden of bottlenecks
- botsingen of interacties tussen objecten
- real-world nauwkeurigheid

Deze keuzes zijn bewust gemaakt om de app begrijpelijk, uitlegbaar en licht te houden.

---

## Ontwerpfilosofie

- Conceptuele helderheid boven technische nauwkeurigheid
- Visuele eenvoud boven functionele volledigheid
- De gebruiker vertelt het verhaal, de app visualiseert het