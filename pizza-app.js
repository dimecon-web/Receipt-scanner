const { useState, useMemo } = React;

// ─── Calcul levure (règle Q10 biologique) ────────────────────────────────────
// La vitesse de fermentation double tous les 10 °C (Q10 = 2).
// Base : 2 g de levure fraîche par kg de farine à 20 °C pour 8 h.
function levureFraicheParKg(temperature, heures) {
  const facteurTemp = Math.pow(2, (temperature - 20) / 10);
  const facteurTemps = heures / 8;
  return Math.min(Math.max(2 / (facteurTemp * facteurTemps), 0.05), 30);
}

// ─── Calcul ingrédients ──────────────────────────────────────────────────────
function calculer({ nbPizzas, poidsPaton, hydratation, temperature, heures, fermentation, preFermentPct }) {
  const totalPate = nbPizzas * poidsPaton;
  const fracEau   = hydratation / 100;
  const fracSel   = 0.028;

  if (fermentation === 'direct') {
    const fracLev = levureFraicheParKg(temperature, heures) / 1000;
    const farine  = totalPate / (1 + fracEau + fracSel + fracLev);
    return {
      type: 'direct',
      totalPate: Math.round(totalPate),
      farine:    Math.round(farine),
      eau:       Math.round(farine * fracEau),
      sel:       +(farine * fracSel).toFixed(1),
      levFraiche: +(farine * fracLev).toFixed(1),
      levSeche:   +(farine * fracLev / 3).toFixed(1),
    };
  }

  // Biga & Poolish : poids levure négligeable dans la masse totale
  const farine    = totalPate / (1 + fracEau + fracSel);
  const eauTotale = farine * fracEau;
  const sel       = +(farine * fracSel).toFixed(1);

  if (fermentation === 'biga') {
    const BIGA_HYD = 0.52;
    const BIGA_LEV = 0.005;
    const bigaFarine = Math.round(farine * preFermentPct / 100);
    const bigaEau    = Math.round(bigaFarine * BIGA_HYD);
    const bigaLevF   = +(bigaFarine * BIGA_LEV).toFixed(1);
    const bigaLevS   = +(bigaFarine * BIGA_LEV / 3).toFixed(2);
    return {
      type: 'biga',
      totalPate: Math.round(totalPate), farine: Math.round(farine),
      bigaFarine, bigaEau, bigaLevF, bigaLevS,
      bigaTotal:   bigaFarine + bigaEau,
      finalFarine: Math.round(farine - bigaFarine),
      finalEau:    Math.round(eauTotale - bigaEau),
      sel,
    };
  }

  // Poolish : 100 % hydratation, 0,2 % levure fraîche
  const POOL_LEV = 0.002;
  const poolFarine = Math.round(farine * preFermentPct / 100);
  const poolEau    = poolFarine;
  const poolLevF   = +(poolFarine * POOL_LEV).toFixed(2);
  const poolLevS   = +(poolFarine * POOL_LEV / 3).toFixed(2);
  return {
    type: 'poolish',
    totalPate: Math.round(totalPate), farine: Math.round(farine),
    poolFarine, poolEau, poolLevF, poolLevS,
    poolTotal:   poolFarine + poolEau,
    finalFarine: Math.round(farine - poolFarine),
    finalEau:    Math.round(eauTotale - poolEau),
    sel,
  };
}

// ─── Conseils ────────────────────────────────────────────────────────────────
function conseil({ temperature, heures, hydratation, fermentation, frigo }) {
  if (frigo)
    return `Fermentation longue au froid : ressortez la pâte du frigo 1–2 h avant étalage pour qu'elle revienne à température ambiante.`;
  if (fermentation === 'biga')
    return "La biga apporte complexité aromatique, mie alvéolée et bord bien développé. Idéale avec une farine de force (W 260–320).";
  if (fermentation === 'poolish')
    return "La poolish donne une pâte très extensible avec une mie légère et ouverte. Parfaite pour les pizzas fines et croustillantes.";
  if (temperature >= 26 && heures <= 4)
    return "Température élevée + temps court : surveillez la levée pour éviter la sur-fermentation.";
  if (heures >= 24)
    return "Fermentation lente = pâte plus savoureuse et digeste. Idéal !";
  if (hydratation >= 72)
    return "Pâte très hydratée : utilisez une farine de force (W 280+) et pliez plutôt que de pétrir.";
  return "Pâte napolitaine classique : étalez à la main pour conserver les bulles d'air.";
}

// ─── Instructions ─────────────────────────────────────────────────────────────
function etapes({ res, nbPizzas, poidsPaton, heures, temperature, frigo, fermentation }) {
  const sortirFrigo = frigo
    ? ['Sortir la pâte du frigo 1–2 h avant de l\'étaler pour qu\'elle revienne à température ambiante.']
    : [];

  if (res.type === 'biga') {
    const bigaTempLabel = frigo ? '6–8 °C (bas du frigo)' : '16–18 °C (cave ou cellier)';
    const bigaTempsLabel = frigo ? '24–48 h' : '16–24 h';
    return [
      {
        titre: '① Préparer la biga (J−1)',
        couleur: 'text-orange-700',
        steps: [
          `Mélanger ${res.bigaFarine} g de farine + ${res.bigaEau} ml d'eau froide. La pâte est très grumeleuse, ne pas trop travailler.`,
          `Ajouter ${res.bigaLevF} g de levure fraîche (ou ${res.bigaLevS} g sèche) et intégrer grossièrement à la main.`,
          `Couvrir de film alimentaire et laisser fermenter ${bigaTempsLabel} à ${bigaTempLabel}.`,
          '✅ Prête quand elle sent légèrement l\'alcool, présente des bulles et a presque doublé de volume.',
        ],
      },
      {
        titre: '② Pâte finale',
        couleur: 'text-gray-700',
        steps: [
          ...(frigo ? ['Sortir la biga du frigo 30 min avant de démarrer la pâte finale.'] : []),
          `Déposer la biga dans le bol. Ajouter les ${res.finalEau} ml d'eau et émietter la biga dedans (2–3 min).`,
          `Incorporer progressivement les ${res.finalFarine} g de farine restante. Pétrir 5 min.`,
          `Ajouter les ${res.sel} g de sel et pétrir encore 8–10 min. Pas de levure supplémentaire.`,
          frigo
            ? `Couvrir et placer au frigo (4 °C) pour ${heures} h.`
            : `Couvrir et laisser reposer ${heures} h à ${temperature} °C.`,
          ...sortirFrigo,
          `Diviser en ${nbPizzas} pâton(s) de ${poidsPaton} g, bouler et laisser pointer 30–60 min à température ambiante.`,
          'Étaler à la main en partant du centre. Garnir et cuire à four très chaud (250–300 °C).',
        ],
      },
    ];
  }

  if (res.type === 'poolish') {
    const poolTempLabel = frigo ? '6–8 °C (bas du frigo)' : '18–22 °C (température ambiante)';
    const poolTempsLabel = frigo ? '24–36 h' : '12–16 h';
    return [
      {
        titre: '① Préparer la poolish (J−1)',
        couleur: 'text-blue-700',
        steps: [
          `Mélanger ${res.poolFarine} g de farine + ${res.poolEau} ml d'eau tiède + ${res.poolLevF} g de levure fraîche (ou ${res.poolLevS} g sèche).`,
          `Couvrir et laisser fermenter ${poolTempsLabel} à ${poolTempLabel}.`,
          '✅ Prête quand la surface est bullée et commence légèrement à retomber au centre.',
        ],
      },
      {
        titre: '② Pâte finale',
        couleur: 'text-gray-700',
        steps: [
          ...(frigo ? ['Sortir la poolish du frigo 30 min avant.'] : []),
          `Verser la poolish dans le bol. Ajouter les ${res.finalEau} ml d'eau et mélanger brièvement.`,
          `Incorporer les ${res.finalFarine} g de farine restante. Pétrir à vitesse lente 3 min.`,
          `Ajouter les ${res.sel} g de sel et pétrir encore 8–10 min. Pas de levure supplémentaire.`,
          frigo
            ? `Couvrir et placer au frigo (4 °C) pour ${heures} h.`
            : `Couvrir et laisser reposer ${heures} h à ${temperature} °C.`,
          ...sortirFrigo,
          `Diviser en ${nbPizzas} pâton(s) de ${poidsPaton} g, bouler délicatement et laisser pointer 30–60 min.`,
          'Étaler délicatement. La mie sera ouverte et légère.',
        ],
      },
    ];
  }

  // Directe
  return [
    {
      titre: 'Méthode directe',
      couleur: 'text-gray-700',
      steps: [
        'Dissoudre la levure dans l\'eau tiède (max 35 °C).',
        'Mélanger la farine et le sel dans un grand bol.',
        'Verser l\'eau progressivement et pétrir 10–12 min.',
        frigo
          ? `Couvrir et placer au frigo (4 °C) pour ${heures} h.`
          : `Couvrir et laisser reposer ${heures} h à ${temperature} °C.`,
        ...sortirFrigo,
        `Diviser en ${nbPizzas} pâton(s) de ${poidsPaton} g, bouler et pointer 30 min à température ambiante.`,
        'Étaler à la main en partant du centre.',
        'Garnir et cuire au four le plus chaud possible.',
      ],
    },
  ];
}

// ─── Composants UI ────────────────────────────────────────────────────────────

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

function Curseur({ min, max, step, valeur, onChange, accent, etiquetteMin, etiquetteMax }) {
  const pct = ((valeur - min) / (max - min)) * 100;
  return (
    <div>
      <input
        type="range" min={min} max={max} step={step} value={valeur}
        onChange={e => onChange(Number(e.target.value))}
        className={`w-full ${accent}`}
        style={{ background: `linear-gradient(to right, currentColor ${pct}%, #e5e7eb ${pct}%)` }}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{etiquetteMin}</span><span>{etiquetteMax}</span>
      </div>
    </div>
  );
}

function StepperPizzas({ valeur, setValeur }) {
  const pct = ((valeur - 1) / 19) * 100;
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => setValeur(v => Math.max(1, v - 1))}
        className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 text-2xl font-bold flex items-center justify-center active:bg-orange-200">−</button>
      <input type="range" min={1} max={20} value={valeur}
        onChange={e => setValeur(Number(e.target.value))}
        className="flex-1 accent-orange-500"
        style={{ background: `linear-gradient(to right, #f97316 ${pct}%, #e5e7eb ${pct}%)` }}
      />
      <button onClick={() => setValeur(v => Math.min(20, v + 1))}
        className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 text-2xl font-bold flex items-center justify-center active:bg-orange-200">+</button>
    </div>
  );
}

function ToggleYeast({ valeur, onChange, bgCls }) {
  return (
    <div className={`flex gap-2 mb-3 p-1 rounded-xl ${bgCls}`}>
      {['seche', 'fraiche'].map(t => (
        <button key={t} onClick={() => onChange(t)}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${valeur === t ? 'bg-white text-yellow-700 shadow-sm' : 'text-gray-500'}`}>
          {t === 'seche' ? 'Levure sèche' : 'Levure fraîche'}
        </button>
      ))}
    </div>
  );
}

function SectionMethode({ res, nbPizzas, poidsPaton, heures, temperature, frigo, fermentation }) {
  const groupes = etapes({ res, nbPizzas, poidsPaton, heures, temperature, frigo, fermentation });
  return (
    <div className="bg-white rounded-3xl shadow-sm p-5 space-y-5">
      <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest">Instructions</h2>
      {groupes.map((groupe, gi) => (
        <div key={gi}>
          <h3 className={`font-bold mb-3 ${groupe.couleur}`}>{groupe.titre}</h3>
          <ol className="space-y-3">
            {groupe.steps.map((step, si) => (
              <li key={si} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center mt-0.5">
                  {si + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

// ─── App principale ───────────────────────────────────────────────────────────
function PizzaCalculator() {
  const [nbPizzas,      setNbPizzas]      = useState(4);
  const [poidsPaton,    setPoidsPaton]    = useState(250);
  const [hydratation,   setHydratation]   = useState(62);
  const [temperature,   setTemperature]   = useState(22);
  const [heures,        setHeures]        = useState(8);
  const [fermentation,  setFermentation]  = useState('direct');
  const [preFermentPct, setPreFermentPct] = useState(40);
  const [frigo,         setFrigo]         = useState(false);
  const [typeYeast,     setTypeYeast]     = useState('seche');

  const tempEffective = frigo ? 4 : temperature;
  const heuresMax  = frigo ? 120 : 72;
  const heuresClamped = Math.min(heures, heuresMax);

  const res = useMemo(
    () => calculer({ nbPizzas, poidsPaton, hydratation, temperature: tempEffective, heures: heuresClamped, fermentation, preFermentPct }),
    [nbPizzas, poidsPaton, hydratation, tempEffective, heuresClamped, fermentation, preFermentPct]
  );

  const tip = useMemo(
    () => conseil({ temperature: tempEffective, heures: heuresClamped, hydratation, fermentation, frigo }),
    [tempEffective, heuresClamped, hydratation, fermentation, frigo]
  );

  function choisirFermentation(id) {
    setFermentation(id);
    if (id === 'biga')    setPreFermentPct(40);
    if (id === 'poolish') setPreFermentPct(30);
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="bg-gradient-to-br from-orange-500 to-red-600 px-5 pt-10 pb-7 shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-extrabold text-white text-center tracking-tight">🍕 Pizza Dough</h1>
          <p className="text-orange-100 text-sm text-center mt-1">Calculateur de pâte à pizza</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-10">

        <div className="bg-white rounded-3xl shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-3">Fermentation</h2>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-4">
            {[
              { id: 'direct',  label: 'Directe'  },
              { id: 'biga',    label: 'Biga'      },
              { id: 'poolish', label: 'Poolish'   },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => choisirFermentation(id)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  fermentation === id ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>
                {label}
              </button>
            ))}
          </div>
          {fermentation === 'direct' && (
            <p className="text-xs text-gray-500 text-center mb-4">Méthode classique en une seule étape. Idéale pour une pizza le jour même.</p>
          )}
          {fermentation === 'biga' && (
            <p className="text-xs text-gray-500 text-center mb-4">Pré-ferment italien ferme (52 % hydratation). Préparez-le 16–24 h à l'avance.</p>
          )}
          {fermentation === 'poolish' && (
            <p className="text-xs text-gray-500 text-center mb-4">Pré-ferment liquide (100 % hydratation). Préparez-le 12–16 h à l'avance.</p>
          )}
          {fermentation !== 'direct' && (
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-semibold text-gray-700">
                  Farine dans {fermentation === 'biga' ? 'la biga' : 'la poolish'}
                </span>
                <span className="text-3xl font-black text-orange-500">
                  {preFermentPct}<span className="text-base font-semibold text-gray-400 ml-1">%</span>
                </span>
              </div>
              <Curseur
                min={20} max={fermentation === 'biga' ? 70 : 60} step={5}
                valeur={preFermentPct} onChange={setPreFermentPct}
                accent="accent-orange-500"
                etiquetteMin="20 % (léger)"
                etiquetteMax={fermentation === 'biga' ? '70 % (intense)' : '60 % (intense)'}
              />
              <p className="text-xs text-gray-400 mt-1 text-center">
                {fermentation === 'biga' ? 'Recommandé : 40–60 %' : 'Recommandé : 25–40 %'}
              </p>
            </div>
          )}
          <button
            onClick={() => { setFrigo(f => !f); if (!frigo && heures < 12) setHeures(24); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all ${
              frigo
                ? 'bg-cyan-50 border-cyan-400 text-cyan-700'
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🧊</span>
              <div className="text-left">
                <div className="font-bold text-sm">Fermentation longue au frigo</div>
                <div className="text-xs opacity-70">Température fixée à 4 °C — jusqu'à 120 h</div>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${frigo ? 'bg-cyan-400' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${frigo ? 'translate-x-4' : ''}`} />
            </div>
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-5 space-y-6">
          <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest">Paramètres</h2>
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <span className="font-semibold text-gray-700">Nombre de pizzas</span>
              <span className="text-4xl font-black text-orange-500">{nbPizzas}</span>
            </div>
            <StepperPizzas valeur={nbPizzas} setValeur={setNbPizzas} />
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-semibold text-gray-700">Poids par pâton</span>
              <span className="text-4xl font-black text-orange-500">
                {poidsPaton}<span className="text-lg font-semibold text-gray-400 ml-1">g</span>
              </span>
            </div>
            <Curseur min={150} max={400} step={10} valeur={poidsPaton} onChange={setPoidsPaton}
              accent="accent-orange-500" etiquetteMin="150 g" etiquetteMax="400 g" />
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-semibold text-gray-700">Hydratation</span>
              <span className="text-4xl font-black text-blue-500">
                {hydratation}<span className="text-lg font-semibold text-gray-400 ml-1">%</span>
              </span>
            </div>
            <Curseur min={55} max={80} step={1} valeur={hydratation} onChange={setHydratation}
              accent="accent-blue-500" etiquetteMin="55 % (ferme)" etiquetteMax="80 % (molle)" />
          </div>
          {frigo ? (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-cyan-50 border border-cyan-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧊</span>
                <span className="font-semibold text-cyan-700">Température frigo</span>
              </div>
              <span className="text-3xl font-black text-cyan-600">4 <span className="text-lg font-semibold text-gray-400">°C</span></span>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-semibold text-gray-700">Température ambiante</span>
                <span className="text-4xl font-black text-red-500">
                  {temperature}<span className="text-lg font-semibold text-gray-400 ml-1">°C</span>
                </span>
              </div>
              <Curseur min={16} max={30} step={1} valeur={temperature} onChange={setTemperature}
                accent="accent-red-500" etiquetteMin="16 °C" etiquetteMax="30 °C" />
            </div>
          )}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-semibold text-gray-700">
                {fermentation !== 'direct' ? 'Repos final de la pâte' : 'Temps de repos'}
              </span>
              <span className={`text-4xl font-black ${frigo ? 'text-cyan-600' : 'text-green-600'}`}>
                {heuresClamped}<span className="text-lg font-semibold text-gray-400 ml-1">h</span>
              </span>
            </div>
            <Curseur
              min={frigo ? 12 : 2} max={heuresMax} step={frigo ? 4 : 1}
              valeur={heuresClamped}
              onChange={v => setHeures(v)}
              accent={frigo ? 'accent-cyan-500' : 'accent-green-500'}
              etiquetteMin={frigo ? '12 h' : '2 h'}
              etiquetteMax={frigo ? '120 h (5 jours)' : '72 h'}
            />
          </div>
        </div>

        {fermentation === 'direct' && (
          <div className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest">Ingrédients</h2>
              <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-3 py-1 rounded-full">{res.totalPate} g total</span>
            </div>
            <LigneIngredient emoji="🌾" label="Farine" valeur={res.farine} unite="g"  bg="bg-amber-50" text="text-amber-800" border="border-amber-200" />
            <LigneIngredient emoji="💧" label="Eau"    valeur={res.eau}    unite="ml" bg="bg-blue-50"  text="text-blue-800"  border="border-blue-200" />
            <LigneIngredient emoji="🧂" label="Sel"    valeur={res.sel}    unite="g"  bg="bg-gray-50"  text="text-gray-700"  border="border-gray-200" />
            <div className="pt-1">
              <ToggleYeast valeur={typeYeast} onChange={setTypeYeast} bgCls="bg-gray-100" />
              <LigneIngredient
                emoji={typeYeast === 'seche' ? '🟡' : '🟤'}
                label={typeYeast === 'seche' ? 'Levure sèche' : 'Levure fraîche'}
                valeur={typeYeast === 'seche' ? res.levSeche : res.levFraiche}
                unite="g"
                bg="bg-yellow-50" text="text-yellow-800" border="border-yellow-200"
              />
              <p className="text-xs text-gray-400 text-center mt-2">Levure sèche = levure fraîche ÷ 3</p>
            </div>
          </div>
        )}

        {fermentation === 'biga' && (
          <>
            <div className={`border-2 rounded-3xl p-5 space-y-3 ${frigo ? 'bg-cyan-50 border-cyan-300' : 'bg-orange-50 border-orange-300'}`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-base font-bold uppercase tracking-widest ${frigo ? 'text-cyan-700' : 'text-orange-700'}`}>① Biga</h2>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${frigo ? 'bg-cyan-200 text-cyan-700' : 'bg-orange-200 text-orange-700'}`}>
                  {frigo ? 'Frigo J−2' : 'Préparer J−1'}
                </span>
              </div>
              <LigneIngredient emoji="🌾" label="Farine"     valeur={res.bigaFarine} unite="g"  bg="bg-white" text="text-amber-800" border="border-amber-200" />
              <LigneIngredient emoji="💧" label="Eau (52 %)" valeur={res.bigaEau}    unite="ml" bg="bg-white" text="text-blue-800"  border="border-blue-200" />
              <div className="pt-1">
                <ToggleYeast valeur={typeYeast} onChange={setTypeYeast} bgCls={frigo ? 'bg-cyan-100' : 'bg-orange-100'} />
                <LigneIngredient
                  emoji={typeYeast === 'seche' ? '🟡' : '🟤'}
                  label={typeYeast === 'seche' ? 'Levure sèche' : 'Levure fraîche'}
                  valeur={typeYeast === 'seche' ? res.bigaLevS : res.bigaLevF}
                  unite="g" bg="bg-white" text="text-yellow-800" border="border-yellow-200"
                />
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest">② Pâte finale</h2>
                <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-3 py-1 rounded-full">{res.totalPate} g total</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl border bg-orange-50 border-orange-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🫙</span>
                  <span className="font-semibold text-orange-800">Biga (intégralité)</span>
                </div>
                <span className="text-lg font-bold text-orange-600">≈ {res.bigaTotal} g</span>
              </div>
              <LigneIngredient emoji="🌾" label="Farine restante" valeur={res.finalFarine} unite="g"  bg="bg-amber-50" text="text-amber-800" border="border-amber-200" />
              <LigneIngredient emoji="💧" label="Eau restante"    valeur={res.finalEau}    unite="ml" bg="bg-blue-50"  text="text-blue-800"  border="border-blue-200" />
              <LigneIngredient emoji="🧂" label="Sel"             valeur={res.sel}         unite="g"  bg="bg-gray-50"  text="text-gray-700"  border="border-gray-200" />
              <p className="text-xs text-gray-400 text-center">Pas de levure supplémentaire — la biga suffit.</p>
            </div>
          </>
        )}

        {fermentation === 'poolish' && (
          <>
            <div className={`border-2 rounded-3xl p-5 space-y-3 ${frigo ? 'bg-cyan-50 border-cyan-300' : 'bg-blue-50 border-blue-300'}`}>
              <div className="flex justify-between items-center">
                <h2 className={`text-base font-bold uppercase tracking-widest ${frigo ? 'text-cyan-700' : 'text-blue-700'}`}>① Poolish</h2>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${frigo ? 'bg-cyan-200 text-cyan-700' : 'bg-blue-200 text-blue-700'}`}>
                  {frigo ? 'Frigo J−2' : 'Préparer J−1'}
                </span>
              </div>
              <LigneIngredient emoji="🌾" label="Farine"       valeur={res.poolFarine} unite="g"  bg="bg-white" text="text-amber-800" border="border-amber-200" />
              <LigneIngredient emoji="💧" label="Eau (100 %)"  valeur={res.poolEau}    unite="ml" bg="bg-white" text="text-blue-800"  border="border-blue-200" />
              <div className="pt-1">
                <ToggleYeast valeur={typeYeast} onChange={setTypeYeast} bgCls={frigo ? 'bg-cyan-100' : 'bg-blue-100'} />
                <LigneIngredient
                  emoji={typeYeast === 'seche' ? '🟡' : '🟤'}
                  label={typeYeast === 'seche' ? 'Levure sèche' : 'Levure fraîche'}
                  valeur={typeYeast === 'seche' ? res.poolLevS : res.poolLevF}
                  unite="g" bg="bg-white" text="text-yellow-800" border="border-yellow-200"
                />
                <p className="text-xs text-gray-400 text-center mt-2">Très petite quantité : balance de précision (0,1 g) recommandée.</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest">② Pâte finale</h2>
                <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-3 py-1 rounded-full">{res.totalPate} g total</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-2xl border bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🫙</span>
                  <span className="font-semibold text-blue-800">Poolish (intégralité)</span>
                </div>
                <span className="text-lg font-bold text-blue-600">≈ {res.poolTotal} g</span>
              </div>
              <LigneIngredient emoji="🌾" label="Farine restante" valeur={res.finalFarine} unite="g"  bg="bg-amber-50" text="text-amber-800" border="border-amber-200" />
              <LigneIngredient emoji="💧" label="Eau restante"    valeur={res.finalEau}    unite="ml" bg="bg-blue-50"  text="text-blue-800"  border="border-blue-200" />
              <LigneIngredient emoji="🧂" label="Sel"             valeur={res.sel}         unite="g"  bg="bg-gray-50"  text="text-gray-700"  border="border-gray-200" />
              <p className="text-xs text-gray-400 text-center">Pas de levure supplémentaire — la poolish suffit.</p>
            </div>
          </>
        )}

        <div className={`border rounded-3xl px-5 py-4 ${frigo ? 'bg-cyan-50 border-cyan-200' : 'bg-orange-50 border-orange-200'}`}>
          <p className={`text-sm ${frigo ? 'text-cyan-800' : 'text-orange-800'}`}>
            <span className="font-bold">{frigo ? '🧊 ' : '💡 '}Conseil : </span>{tip}
          </p>
        </div>

        <SectionMethode
          res={res}
          nbPizzas={nbPizzas} poidsPaton={poidsPaton}
          heures={heuresClamped} temperature={tempEffective}
          frigo={frigo} fermentation={fermentation}
        />

        <div className="bg-white rounded-3xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-2">📱 Installer sur iPhone</h3>
          <ol className="list-decimal list-inside space-y-1 text-xs text-gray-500">
            <li>Ouvrez dans <strong>Safari</strong></li>
            <li>Appuyez sur <strong>Partager ⬆️</strong></li>
            <li>Choisissez <strong>« Sur l'écran d'accueil »</strong></li>
          </ol>
        </div>

      </div>
    </div>
  );
}

ReactDOM.render(<PizzaCalculator />, document.getElementById('root'));
