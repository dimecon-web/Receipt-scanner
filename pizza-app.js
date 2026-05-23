const { useState, useMemo } = React;

// ─── Calcul de la levure (règle Q10 biologique) ───────────────────────────────
// Base : 2 g de levure fraîche par kg de farine à 20°C pour 8 h de repos
// La vitesse de fermentation double tous les 10°C (Q10 = 2)
function levureFraicheParKg(temperature, heures) {
  const base = 2.0;
  const facteurTemp = Math.pow(2, (temperature - 20) / 10);
  const facteurTemps = heures / 8;
  const gParKg = base / (facteurTemp * facteurTemps);
  return Math.min(Math.max(gParKg, 0.05), 30);
}

function calculerIngredients(nbPizzas, poidsPaton, hydratation, temperature, heures) {
  const totalPate = nbPizzas * poidsPaton;
  const gLevFraiche = levureFraicheParKg(temperature, heures); // g par kg farine
  const fracLev = gLevFraiche / 1000;
  const fracEau = hydratation / 100;
  const fracSel = 0.028; // 2.8 %

  const farine = totalPate / (1 + fracEau + fracSel + fracLev);
  const eau    = farine * fracEau;
  const sel    = farine * fracSel;
  const levFraiche = farine * fracLev;
  const levSeche   = levFraiche / 3;

  return {
    farine:    Math.round(farine),
    eau:       Math.round(eau),
    sel:       Math.round(sel * 10) / 10,
    levFraiche: Math.round(levFraiche * 10) / 10,
    levSeche:   Math.round(levSeche * 10) / 10,
    totalPate:  Math.round(totalPate),
  };
}

function conseil(temperature, heures, hydratation) {
  if (temperature >= 26 && heures <= 4)
    return "Température élevée + temps court : surveillez bien la levée pour éviter la sur-fermentation.";
  if (heures >= 48)
    return "Longue fermentation à froid possible (frigo 4 °C). Les arômes seront exceptionnels.";
  if (heures >= 24)
    return "Fermentation lente = pâte plus savoureuse et plus digeste. Idéal !";
  if (hydratation >= 72)
    return "Pâte très hydratée : utilisez une farine de force (W 280+) et pliez plutôt que de pétrir.";
  if (hydratation >= 65)
    return "Bonne hydratation pour une belle alvéolaire et un bord croustillant.";
  if (temperature < 18)
    return "Température fraîche : levée lente et régulière, parfait pour la nuit.";
  return "Pâte napolitaine classique : étalez à la main pour conserver les bulles d'air.";
}

// ─── Composants ───────────────────────────────────────────────────────────────

function LigneIngredient({ emoji, label, valeur, unite, bg, text, border }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${bg} ${border}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <span className={`font-semibold text-base ${text}`}>{label}</span>
      </div>
      <div className={`text-right ${text}`}>
        <span className="text-3xl font-bold">{valeur}</span>
        <span className="text-sm font-normal opacity-70 ml-1">{unite}</span>
      </div>
    </div>
  );
}

function Curseur({ min, max, step, valeur, onChange, couleurClass, etiquetteMin, etiquetteMax }) {
  return (
    <div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={valeur}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full ${couleurClass}`}
        style={{ background: `linear-gradient(to right, currentColor ${((valeur - min) / (max - min)) * 100}%, #e5e7eb ${((valeur - min) / (max - min)) * 100}%)` }}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{etiquetteMin}</span>
        <span>{etiquetteMax}</span>
      </div>
    </div>
  );
}

function BoutonStepperNb({ valeur, setValeur, min, max }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setValeur(v => Math.max(min, v - 1))}
        className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 text-2xl font-bold flex items-center justify-center active:bg-orange-200"
      >−</button>
      <input
        type="range" min={min} max={max} value={valeur}
        onChange={e => setValeur(Number(e.target.value))}
        className="flex-1"
        style={{
          background: `linear-gradient(to right, #f97316 ${((valeur - min) / (max - min)) * 100}%, #e5e7eb ${((valeur - min) / (max - min)) * 100}%)`,
          accentColor: '#f97316'
        }}
      />
      <button
        onClick={() => setValeur(v => Math.min(max, v + 1))}
        className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 text-2xl font-bold flex items-center justify-center active:bg-orange-200"
      >+</button>
    </div>
  );
}

// ─── App principale ────────────────────────────────────────────────────────────

function PizzaCalculator() {
  const [nbPizzas,    setNbPizzas]    = useState(4);
  const [poidsPaton,  setPoidsPaton]  = useState(250);
  const [hydratation, setHydratation] = useState(62);
  const [temperature, setTemperature] = useState(22);
  const [heures,      setHeures]      = useState(8);
  const [typeYeast,   setTypeYeast]   = useState('seche');

  const res = useMemo(
    () => calculerIngredients(nbPizzas, poidsPaton, hydratation, temperature, heures),
    [nbPizzas, poidsPaton, hydratation, temperature, heures]
  );

  const tip = useMemo(
    () => conseil(temperature, heures, hydratation),
    [temperature, heures, hydratation]
  );

  return (
    <div className="min-h-screen bg-amber-50 safe-area-pt">
      {/* En-tête */}
      <div className="bg-gradient-to-br from-orange-500 to-red-600 safe-area-pt px-5 pt-6 pb-7 shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-extrabold text-white text-center tracking-tight">🍕 Pizza Dough</h1>
          <p className="text-orange-100 text-sm text-center mt-1">Calculateur de pâte à pizza</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 safe-area-pb">

        {/* ── Paramètres ── */}
        <div className="bg-white rounded-3xl shadow-sm p-5 space-y-6">
          <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest">Paramètres</h2>

          {/* Nombre de pizzas */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <span className="font-semibold text-gray-700">Nombre de pizzas</span>
              <span className="text-4xl font-black text-orange-500">{nbPizzas}</span>
            </div>
            <BoutonStepperNb valeur={nbPizzas} setValeur={setNbPizzas} min={1} max={20} />
          </div>

          {/* Poids par pâton */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-semibold text-gray-700">Poids par pâton</span>
              <span className="text-4xl font-black text-orange-500">
                {poidsPaton}<span className="text-lg font-semibold text-gray-400 ml-1">g</span>
              </span>
            </div>
            <Curseur
              min={150} max={400} step={10}
              valeur={poidsPaton} onChange={setPoidsPaton}
              couleurClass="accent-orange-500"
              etiquetteMin="150 g (mini)"
              etiquetteMax="400 g (maxi)"
            />
          </div>

          {/* Hydratation */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-semibold text-gray-700">Hydratation</span>
              <span className="text-4xl font-black text-blue-500">
                {hydratation}<span className="text-lg font-semibold text-gray-400 ml-1">%</span>
              </span>
            </div>
            <Curseur
              min={55} max={80} step={1}
              valeur={hydratation} onChange={setHydratation}
              couleurClass="accent-blue-500"
              etiquetteMin="55 % (ferme)"
              etiquetteMax="80 % (molle)"
            />
          </div>

          {/* Température */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-semibold text-gray-700">Température ambiante</span>
              <span className="text-4xl font-black text-red-500">
                {temperature}<span className="text-lg font-semibold text-gray-400 ml-1">°C</span>
              </span>
            </div>
            <Curseur
              min={16} max={30} step={1}
              valeur={temperature} onChange={setTemperature}
              couleurClass="accent-red-500"
              etiquetteMin="16 °C"
              etiquetteMax="30 °C"
            />
          </div>

          {/* Temps de repos */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-semibold text-gray-700">Temps de repos</span>
              <span className="text-4xl font-black text-green-600">
                {heures}<span className="text-lg font-semibold text-gray-400 ml-1">h</span>
              </span>
            </div>
            <Curseur
              min={2} max={72} step={1}
              valeur={heures} onChange={setHeures}
              couleurClass="accent-green-500"
              etiquetteMin="2 h"
              etiquetteMax="72 h"
            />
          </div>
        </div>

        {/* ── Résultats ── */}
        <div className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest">Ingrédients</h2>
            <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-3 py-1 rounded-full">
              {res.totalPate} g total
            </span>
          </div>

          <LigneIngredient
            emoji="🌾" label="Farine"
            valeur={res.farine} unite="g"
            bg="bg-amber-50" text="text-amber-800" border="border-amber-200"
          />
          <LigneIngredient
            emoji="💧" label="Eau"
            valeur={res.eau} unite="ml"
            bg="bg-blue-50" text="text-blue-800" border="border-blue-200"
          />
          <LigneIngredient
            emoji="🧂" label="Sel"
            valeur={res.sel} unite="g"
            bg="bg-gray-50" text="text-gray-700" border="border-gray-200"
          />

          {/* Toggle levure */}
          <div className="pt-1">
            <div className="flex gap-2 mb-3 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setTypeYeast('seche')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  typeYeast === 'seche'
                    ? 'bg-white text-yellow-700 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Levure sèche
              </button>
              <button
                onClick={() => setTypeYeast('fraiche')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  typeYeast === 'fraiche'
                    ? 'bg-white text-yellow-700 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Levure fraîche
              </button>
            </div>
            {typeYeast === 'seche' ? (
              <LigneIngredient
                emoji="🟡" label="Levure sèche"
                valeur={res.levSeche} unite="g"
                bg="bg-yellow-50" text="text-yellow-800" border="border-yellow-200"
              />
            ) : (
              <LigneIngredient
                emoji="🟤" label="Levure fraîche"
                valeur={res.levFraiche} unite="g"
                bg="bg-yellow-50" text="text-yellow-800" border="border-yellow-200"
              />
            )}
            <p className="text-xs text-gray-400 text-center mt-2">
              Levure sèche = levure fraîche ÷ 3
            </p>
          </div>
        </div>

        {/* ── Conseil ── */}
        <div className="bg-orange-50 border border-orange-200 rounded-3xl px-5 py-4">
          <p className="text-sm text-orange-800">
            <span className="font-bold">💡 Conseil : </span>{tip}
          </p>
        </div>

        {/* ── Méthode ── */}
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-3">Méthode</h2>
          <ol className="space-y-2 text-sm text-gray-600 list-none">
            {[
              "Dissoudre la levure dans l'eau tiède (max 35 °C).",
              "Mélanger la farine et le sel dans un grand bol.",
              "Verser l'eau progressivement et pétrir 10–12 min.",
              `Couvrir et laisser reposer ${heures} h à ${temperature} °C.`,
              `Diviser en ${nbPizzas} pâton(s) de ${poidsPaton} g.`,
              "Etaler à la main en partant du centre vers les bords.",
              "Garnir et cuire au four le plus chaud possible.",
            ].map((etape, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{etape}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* ── Installer ── */}
        <div className="bg-white rounded-3xl shadow-sm p-5 text-sm text-gray-600">
          <h3 className="font-bold text-gray-800 mb-2">📱 Installer sur iPhone</h3>
          <ol className="list-decimal list-inside space-y-1 text-xs text-gray-500">
            <li>Ouvrez cette page dans <strong>Safari</strong></li>
            <li>Appuyez sur le bouton <strong>Partager ⬆️</strong></li>
            <li>Choisissez <strong>« Sur l'écran d'accueil »</strong></li>
            <li>L'app se lance comme une vraie application !</li>
          </ol>
        </div>

      </div>
    </div>
  );
}

ReactDOM.render(<PizzaCalculator />, document.getElementById('root'));
