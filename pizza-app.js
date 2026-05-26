const { useState, useMemo } = React;

// ─── Calcul levure directe (règle Q10) ───────────────────────────────────────
function levureFraicheParKg(temperature, heures) {
  const facteurTemp = Math.pow(2, (temperature - 20) / 10);
  const facteurTemps = heures / 8;
  return Math.min(Math.max(2 / (facteurTemp * facteurTemps), 0.05), 30);
}

// ─── Calcul levure pré-ferment (règle Q10) ────────────────────────────────────
function levurePreFerment(temperature, heures, baseGParKg, tempRef, heuresRef) {
  const facteurTemp = Math.pow(2, (temperature - tempRef) / 10);
  const facteurTemps = heures / heuresRef;
  return Math.min(Math.max(baseGParKg / (facteurTemp * facteurTemps), 0.05), 50);
}

// ─── Calcul pizza ─────────────────────────────────────────────────────────────
function calculer({ nbPizzas, poidsPaton, hydratation, temperature, heures, fermentation, preFermentPct, tempPreFerment, heuresPreFerment }) {
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

  const farine    = totalPate / (1 + fracEau + fracSel);
  const eauTotale = farine * fracEau;
  const sel       = +(farine * fracSel).toFixed(1);

  if (fermentation === 'biga') {
    const BIGA_HYD = 0.52;
    const bigaLevGParKg = levurePreFerment(tempPreFerment, heuresPreFerment, 5, 18, 18);
    const BIGA_LEV = bigaLevGParKg / 1000;
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

  const poolLevGParKg = levurePreFerment(tempPreFerment, heuresPreFerment, 2, 20, 12);
  const POOL_LEV = poolLevGParKg / 1000;
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

// ─── Calcul pain ──────────────────────────────────────────────────────────────
function calculerPain({ nbPains, poidsPain, hydratation, sel, fermentation, levainPct, preFermentPct, tempPreFerment, heuresPreFerment, tempPointage, heuresPointage, heuresApprêt, frigoApprêt }) {
  const totalPate = nbPains * poidsPain;
  const fracEau   = hydratation / 100;
  const fracSel   = sel / 100;

  if (fermentation === 'levain') {
    const farine      = totalPate / (1 + fracEau + fracSel);
    const levainPoids = Math.round(farine * levainPct / 100);
    const levainFarine = Math.round(levainPoids / 2);
    const levainEau    = levainPoids - levainFarine;
    const farineFinale = Math.round(farine - levainFarine);
    const eauFinale    = Math.round(farine * fracEau - levainEau);
    const selG         = +(farine * fracSel).toFixed(1);
    return {
      type: 'levain',
      totalPate: Math.round(totalPate),
      farine: Math.round(farine),
      levainPoids, levainFarine, levainEau,
      farineFinale, eauFinale, sel: selG,
    };
  }

  if (fermentation === 'direct') {
    const heuresTotal = heuresPointage + heuresApprêt;
    const levGParKg   = levurePreFerment(tempPointage, heuresTotal, 1.5, 22, 14);
    const fracLev     = levGParKg / 1000;
    const farine      = totalPate / (1 + fracEau + fracSel + fracLev);
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

  // poolish pain
  const farine    = totalPate / (1 + fracEau + fracSel);
  const eauTotale = farine * fracEau;
  const selG      = +(farine * fracSel).toFixed(1);
  const poolLevGParKg = levurePreFerment(tempPreFerment, heuresPreFerment, 2, 20, 12);
  const POOL_LEV  = poolLevGParKg / 1000;
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
    sel: selG,
  };
}

// ─── Conseils pizza ───────────────────────────────────────────────────────────
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

// ─── Conseils pain ────────────────────────────────────────────────────────────
function conseilPain({ fermentation, hydratation, frigoApprêt }) {
  if (fermentation === 'levain')
    return "Le levain naturel développe des arômes complexes et améliore la conservation. Utilisez-le quand il est à son pic (bombé, bulleux, odeur douce-acide).";
  if (fermentation === 'poolish')
    return "La poolish apporte légèreté et ouverture de mie. Avec une farine T65 ou T80 pour un bon équilibre.";
  if (frigoApprêt)
    return "L'apprêt au froid ralentit la fermentation et développe les arômes. Incisez directement sorti du frigo pour une meilleure oreille.";
  if (hydratation >= 78)
    return "Pâte très hydratée : manipulez délicatement, utilisez le rabattage plutôt que le pétrissage, et farinez bien lors du façonnage.";
  return "Pain à la levure : simple et rapide. Une farine T65 ou T80 donnera une belle mie.";
}

// ─── Instructions pizza ───────────────────────────────────────────────────────
function etapes({ res, nbPizzas, poidsPaton, heures, temperature, frigo, fermentation, tempPreFerment, heuresPreFerment }) {
  const sortirFrigo = frigo
    ? ['Sortir la pâte du frigo 1–2 h avant de l\'étaler pour qu\'elle revienne à température ambiante.']
    : [];

  if (res.type === 'biga') {
    return [
      {
        titre: '① Préparer la biga',
        couleur: 'text-orange-700',
        steps: [
          `Mélanger ${res.bigaFarine} g de farine + ${res.bigaEau} ml d'eau froide. La pâte est très grumeleuse, ne pas trop travailler.`,
          `Ajouter ${res.bigaLevF} g de levure fraîche (ou ${res.bigaLevS} g sèche) et intégrer grossièrement à la main.`,
          `Couvrir de film alimentaire et laisser fermenter ${heuresPreFerment} h à ${tempPreFerment} °C.`,
          '✅ Prête quand elle sent légèrement l\'alcool, présente des bulles et a presque doublé de volume.',
        ],
      },
      {
        titre: '② Pâte finale',
        couleur: 'text-gray-700',
        steps: [
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
    return [
      {
        titre: '① Préparer la poolish',
        couleur: 'text-blue-700',
        steps: [
          `Mélanger ${res.poolFarine} g de farine + ${res.poolEau} ml d'eau tiède + ${res.poolLevF} g de levure fraîche (ou ${res.poolLevS} g sèche).`,
          `Couvrir et laisser fermenter ${heuresPreFerment} h à ${tempPreFerment} °C.`,
          '✅ Prête quand la surface est bullée et commence légèrement à retomber au centre.',
        ],
      },
      {
        titre: '② Pâte finale',
        couleur: 'text-gray-700',
        steps: [
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

// ─── Instructions pain ────────────────────────────────────────────────────────
function etapesPain({ res, nbPains, poidsPain, fermentation, heuresPointage, tempPointage, heuresApprêt, frigoApprêt, heuresLevain }) {
  if (res.type === 'levain') {
    const nbRabattages = heuresPointage >= 4 ? 4 : heuresPointage >= 2 ? 2 : 1;
    return [
      {
        titre: '① Rafraîchir le levain',
        couleur: 'text-amber-700',
        steps: [
          `Mélanger ${res.levainFarine} g de farine + ${res.levainEau} ml d'eau + ${Math.round(res.levainPoids * 0.1)} g de levain chef.`,
          `Couvrir et laisser pointer ${heuresLevain} h à température ambiante (20–22 °C).`,
          '✅ Prêt quand il a doublé, est bombé et passe le test de flottaison (une cuillère dans l\'eau).',
        ],
      },
      {
        titre: '② Autolyse + pétrissage',
        couleur: 'text-gray-700',
        steps: [
          `Mélanger ${res.farineFinale} g de farine + ${res.eauFinale} ml d'eau. Reposer 30–45 min (autolyse).`,
          `Ajouter ${res.levainPoids} g de levain, incorporer en pinçant la pâte pendant 3–4 min.`,
          `Ajouter ${res.sel} g de sel dissous dans un filet d'eau, intégrer en pliant et pinçant encore 2 min.`,
          'Laisser reposer 30 min à couvert.',
        ],
      },
      {
        titre: `③ Pointage — ${heuresPointage} h à ${tempPointage} °C`,
        couleur: 'text-green-700',
        steps: [
          ...Array.from({ length: nbRabattages }, (_, i) =>
            `Série de rabattages ${i + 1}/${nbRabattages} (coil folds) : toutes les ${Math.floor(heuresPointage * 60 / (nbRabattages + 1))} min, soulever le centre et replier 4 fois.`
          ),
          `Laisser pointer sans toucher jusqu'à ce que la pâte ait augmenté de 50–75 %.`,
        ],
      },
      {
        titre: `④ Façonnage + apprêt${frigoApprêt ? ' au froid' : ''}`,
        couleur: 'text-purple-700',
        steps: [
          `Diviser délicatement en ${nbPains} pâton(s) de ~${poidsPain} g.`,
          'Pré-façonner en boule, laisser détendre 20–30 min à découvert.',
          'Façonner en boule (boule) ou en bâtard (ovale) : rabattre les bords vers le centre, retourner, faire rouler pour créer tension.',
          `Déposer dans un banneton fariné (ou bol chemisé) soudure vers le haut.`,
          frigoApprêt
            ? `Couvrir et placer au frigo (4 °C) pour ${heuresApprêt} h (ou jusqu'à 16 h).`
            : `Couvrir et laisser lever ${heuresApprêt} h à température ambiante.`,
        ],
      },
      {
        titre: '⑤ Cuisson en cocotte',
        couleur: 'text-red-700',
        steps: [
          'Préchauffer le four à 250 °C avec la cocotte (fonte ou céramique) à l\'intérieur pendant 45–60 min.',
          frigoApprêt
            ? 'Retourner le pâton directement sorti du frigo dans la cocotte chaude. Inciser rapidement à 45° avec une lame de rasoir.'
            : 'Retourner le pâton dans la cocotte chaude. Inciser rapidement à 45° avec une lame de rasoir.',
          'Enfourner avec couvercle 20 min (vapeur), puis retirer le couvercle et poursuivre 20–25 min.',
          '✅ Prêt quand la croûte est brun foncé et sonne creux quand on frappe le dessous.',
          'Laisser refroidir sur grille au moins 1 h avant de couper.',
        ],
      },
    ];
  }

  if (res.type === 'direct') {
    return [
      {
        titre: '① Pétrissage',
        couleur: 'text-gray-700',
        steps: [
          `Dissoudre ${res.levFraiche} g de levure fraîche (ou ${res.levSeche} g sèche) dans ${Math.round(res.eau * 0.3)} ml d'eau tiède.`,
          `Mélanger ${res.farine} g de farine, verser l'eau levurée + le reste d'eau (${res.eau} ml total).`,
          `Incorporer ${res.sel} g de sel après 2 min de mélange. Pétrir 12–15 min jusqu'à pâte lisse et élastique.`,
          'Bouler, déposer dans un bol huilé, couvrir.',
        ],
      },
      {
        titre: `② Pointage — ${heuresPointage} h à ${tempPointage} °C`,
        couleur: 'text-green-700',
        steps: [
          `Laisser lever ${heuresPointage} h à ${tempPointage} °C jusqu'à doublement du volume.`,
          `Donner 1–2 séries de rabattages dans la première heure.`,
        ],
      },
      {
        titre: `③ Façonnage + apprêt${frigoApprêt ? ' au froid' : ''}`,
        couleur: 'text-purple-700',
        steps: [
          `Diviser en ${nbPains} pâton(s), pré-façonner, détendre 20 min.`,
          'Façonner en boule ou bâtard, déposer dans banneton fariné.',
          frigoApprêt
            ? `Apprêt au frigo (4 °C) — ${heuresApprêt} h.`
            : `Apprêt à température ambiante — ${heuresApprêt} h.`,
        ],
      },
      {
        titre: '④ Cuisson en cocotte',
        couleur: 'text-red-700',
        steps: [
          'Préchauffer le four à 250 °C avec la cocotte 45–60 min.',
          'Retourner, inciser à 45°, enfourner.',
          'Couvercle : 20 min, puis découvert 20–25 min.',
          'Laisser refroidir 1 h avant de couper.',
        ],
      },
    ];
  }

  // poolish pain
  return [
    {
      titre: '① Préparer la poolish',
      couleur: 'text-blue-700',
      steps: [
        `Mélanger ${res.poolFarine} g de farine + ${res.poolEau} ml d'eau tiède + ${res.poolLevF} g de levure fraîche (ou ${res.poolLevS} g sèche).`,
        `Couvrir et laisser fermenter ${heuresApprêt} h à température ambiante.`,
        '✅ Surface bullée et légèrement rétractée au centre.',
      ],
    },
    {
      titre: '② Pétrissage',
      couleur: 'text-gray-700',
      steps: [
        `Verser la poolish, ajouter ${res.finalEau} ml d'eau, mélanger.`,
        `Incorporer ${res.finalFarine} g de farine restante. Pétrir 3 min lent.`,
        `Ajouter ${res.sel} g de sel. Pétrir 10 min jusqu'à pâte lisse.`,
      ],
    },
    {
      titre: `③ Pointage — ${heuresPointage} h à ${tempPointage} °C`,
      couleur: 'text-green-700',
      steps: [
        `Laisser pointer ${heuresPointage} h, avec 2–3 séries de coil folds dans la première heure.`,
      ],
    },
    {
      titre: `④ Façonnage + apprêt`,
      couleur: 'text-purple-700',
      steps: [
        `Diviser en ${nbPains} pâton(s), façonner, déposer en banneton.`,
        frigoApprêt
          ? `Apprêt au frigo (4 °C) — ${heuresApprêt} h.`
          : `Apprêt à température ambiante — ${heuresApprêt} h.`,
      ],
    },
    {
      titre: '⑤ Cuisson en cocotte',
      couleur: 'text-red-700',
      steps: [
        'Préchauffer le four à 250 °C avec la cocotte 45–60 min.',
        'Retourner, inciser, enfourner. Couvercle 20 min, puis découvert 20–25 min.',
        'Refroidir 1 h avant de couper.',
      ],
    },
  ];
}

// ─── Formatage dates ──────────────────────────────────────────────────────────
function formatHeure(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatJour(date) {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cible = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff  = Math.round((cible - today) / 86400000);
  if (diff === 0)  return "Aujourd'hui";
  if (diff === 1)  return 'Demain';
  if (diff === -1) return 'Hier';
  if (diff < 0)    return `Il y a ${-diff} jours`;
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── Composants partagés ──────────────────────────────────────────────────────

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

function Stepper({ valeur, setValeur, min, max, accent }) {
  const pct = ((valeur - min) / (max - min)) * 100;
  const accentColor = accent || 'orange';
  return (
    <div className="flex items-center gap-3">
      <button onClick={() => setValeur(v => Math.max(min, v - 1))}
        className={`w-11 h-11 rounded-full bg-${accentColor}-100 text-${accentColor}-600 text-2xl font-bold flex items-center justify-center active:bg-${accentColor}-200`}>−</button>
      <input type="range" min={min} max={max} value={valeur}
        onChange={e => setValeur(Number(e.target.value))}
        className={`flex-1 accent-${accentColor}-500`}
        style={{ background: `linear-gradient(to right, var(--tw-gradient-from, #f97316) ${pct}%, #e5e7eb ${pct}%)` }}
      />
      <button onClick={() => setValeur(v => Math.min(max, v + 1))}
        className={`w-11 h-11 rounded-full bg-${accentColor}-100 text-${accentColor}-600 text-2xl font-bold flex items-center justify-center active:bg-${accentColor}-200`}>+</button>
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

function JoursChips({ jourCuisson, setJourCuisson }) {
  const chips = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      offset: i,
      jourAbr: i === 0 ? "Auj." : i === 1 ? "Dem." : d.toLocaleDateString('fr-FR', { weekday: 'short' }),
      date: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    };
  });
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
      {chips.map(({ offset, jourAbr, date }) => (
        <button key={offset} onClick={() => setJourCuisson(offset)}
          className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl min-w-14 transition-all ${
            jourCuisson === offset ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600'
          }`}>
          <span className="text-xs font-bold">{jourAbr}</span>
          <span className="text-xs opacity-80">{date}</span>
        </button>
      ))}
    </div>
  );
}

function SectionHeureCuisson({ heureCuisson, setHeureCuisson, jourCuisson, setJourCuisson }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-5">
      <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-1">🕐 Heure de cuisson</h2>
      <p className="text-xs text-gray-400 mb-4">Le planning de toutes les étapes sera calculé à rebours.</p>
      <JoursChips jourCuisson={jourCuisson} setJourCuisson={setJourCuisson} />
      <div className="flex items-center gap-3">
        <input
          type="time" value={heureCuisson}
          onChange={e => setHeureCuisson(e.target.value)}
          className="flex-1 text-3xl font-black text-orange-500 border-2 border-orange-200 rounded-2xl px-4 py-3 outline-none bg-orange-50 text-center focus:border-orange-400"
        />
        {heureCuisson && (
          <button onClick={() => setHeureCuisson('')}
            className="w-11 h-11 rounded-full bg-gray-100 text-gray-400 text-xl font-bold flex items-center justify-center active:bg-gray-200">×</button>
        )}
      </div>
    </div>
  );
}

function SectionPlanning({ planning }) {
  if (!planning) return null;
  return (
    <div className="bg-white rounded-3xl shadow-sm p-5">
      <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-4">📅 Planning</h2>
      <div>
        {planning.map((etape, i) => {
          const maintenant = new Date();
          const estPasse   = etape.date < maintenant && !etape.isCuisson;
          return (
            <div key={i} className="flex items-stretch gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0 ${
                  etape.isCuisson ? 'bg-red-100' : estPasse ? 'bg-gray-100' : 'bg-orange-100'
                }`}>{etape.emoji}</div>
                {i < planning.length - 1 && (
                  <div className="w-0.5 bg-gray-200 flex-1 my-1" style={{minHeight: '1.5rem'}} />
                )}
              </div>
              <div className={`flex-1 pb-5 ${i === planning.length - 1 ? 'pb-0' : ''}`}>
                <div className={`font-bold text-sm ${estPasse ? 'text-gray-400' : etape.isCuisson ? 'text-red-600' : 'text-gray-800'}`}>
                  {etape.label}
                  {estPasse && <span className="ml-2 text-xs font-normal text-orange-400">⚠️ déjà passé</span>}
                </div>
                <div className={`text-xs mt-0.5 ${estPasse ? 'text-gray-300' : 'text-gray-500'}`}>
                  {formatJour(etape.date)}
                </div>
              </div>
              <div className={`text-right flex-shrink-0 pt-0.5 ${estPasse ? 'opacity-40' : ''}`}>
                <div className={`text-2xl font-black tabular-nums ${etape.isCuisson ? 'text-red-500' : 'text-gray-700'}`}>
                  {formatHeure(etape.date)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionInstructions({ groupes }) {
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

// ─── Calculateur Pizza ────────────────────────────────────────────────────────
function PizzaCalculator() {
  const [nbPizzas,         setNbPizzas]         = useState(4);
  const [poidsPaton,       setPoidsPaton]       = useState(250);
  const [hydratation,      setHydratation]      = useState(62);
  const [temperature,      setTemperature]      = useState(22);
  const [heures,           setHeures]           = useState(8);
  const [fermentation,     setFermentation]     = useState('direct');
  const [preFermentPct,    setPreFermentPct]    = useState(40);
  const [tempPreFerment,   setTempPreFerment]   = useState(18);
  const [heuresPreFerment, setHeuresPreFerment] = useState(18);
  const [frigo,            setFrigo]            = useState(false);
  const [typeYeast,        setTypeYeast]        = useState('seche');
  const [heureCuisson,     setHeureCuisson]     = useState('');
  const [jourCuisson,      setJourCuisson]      = useState(0);

  const tempEffective = frigo ? 4 : temperature;
  const heuresMax     = frigo ? 120 : 72;
  const heuresClamped = Math.min(heures, heuresMax);

  const heuresPreFermentMin  = fermentation === 'biga' ? 8  : 4;
  const heuresPreFermentMax  = fermentation === 'biga' ? 96 : 48;
  const heuresPreFermentStep = fermentation === 'biga' ? 2  : 1;

  const res = useMemo(
    () => calculer({ nbPizzas, poidsPaton, hydratation, temperature: tempEffective, heures: heuresClamped, fermentation, preFermentPct, tempPreFerment, heuresPreFerment }),
    [nbPizzas, poidsPaton, hydratation, tempEffective, heuresClamped, fermentation, preFermentPct, tempPreFerment, heuresPreFerment]
  );

  const tip = useMemo(
    () => conseil({ temperature: tempEffective, heures: heuresClamped, hydratation, fermentation, frigo }),
    [tempEffective, heuresClamped, hydratation, fermentation, frigo]
  );

  const planning = useMemo(() => {
    if (!heureCuisson) return null;
    const [h, m] = heureCuisson.split(':').map(Number);
    const cuisson = new Date();
    cuisson.setDate(cuisson.getDate() + jourCuisson);
    cuisson.setHours(h, m, 0, 0);

    const BUFFER_MS  = 60 * 60000;
    const faconnage  = new Date(cuisson.getTime() - BUFFER_MS);
    const debutFinal = new Date(faconnage.getTime() - heuresClamped * 3600000);

    const etapesArr = [];

    if (fermentation !== 'direct') {
      const debutPre = new Date(debutFinal.getTime() - heuresPreFerment * 3600000);
      etapesArr.push({
        label: fermentation === 'biga' ? 'Préparer la biga' : 'Préparer la poolish',
        emoji: fermentation === 'biga' ? '🟠' : '🔵',
        date: debutPre,
      });
      etapesArr.push({ label: 'Commencer la pâte finale', emoji: '🌾', date: debutFinal });
    } else {
      etapesArr.push({ label: 'Commencer le pétrissage', emoji: '🌾', date: debutFinal });
    }

    etapesArr.push({ label: 'Façonner + préchauffer le four', emoji: '🔥', date: faconnage });
    etapesArr.push({ label: 'Enfourner', emoji: '🍕', date: cuisson, isCuisson: true });

    return etapesArr;
  }, [heureCuisson, jourCuisson, fermentation, heuresClamped, heuresPreFerment]);

  function choisirFermentation(id) {
    setFermentation(id);
    if (id === 'biga')    { setPreFermentPct(40); setTempPreFerment(18); setHeuresPreFerment(18); }
    if (id === 'poolish') { setPreFermentPct(30); setTempPreFerment(20); setHeuresPreFerment(12); }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-10">

      <SectionHeureCuisson
        heureCuisson={heureCuisson} setHeureCuisson={setHeureCuisson}
        jourCuisson={jourCuisson}   setJourCuisson={setJourCuisson}
      />

      <SectionPlanning planning={planning} />

      {/* Type fermentation */}
      <div className="bg-white rounded-3xl shadow-sm p-5">
        <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-3">Fermentation</h2>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-4">
          {[{ id: 'direct', label: 'Directe' }, { id: 'biga', label: 'Biga' }, { id: 'poolish', label: 'Poolish' }].map(({ id, label }) => (
            <button key={id} onClick={() => choisirFermentation(id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${fermentation === id ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>

        {fermentation === 'direct' && (
          <p className="text-xs text-gray-500 text-center mb-4">Méthode classique en une seule étape. Idéale pour une pizza le jour même.</p>
        )}

        {fermentation !== 'direct' && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {fermentation === 'biga' ? '① Paramètres biga' : '① Paramètres poolish'}
            </p>
            {fermentation === 'biga' && <p className="text-xs text-gray-500 -mt-2">Pré-ferment ferme (52 % hydratation). Préparez-le à l'avance.</p>}
            {fermentation === 'poolish' && <p className="text-xs text-gray-500 -mt-2">Pré-ferment liquide (100 % hydratation). Préparez-le à l'avance.</p>}

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-semibold text-gray-700 text-sm">Farine dans {fermentation === 'biga' ? 'la biga' : 'la poolish'}</span>
                <span className="text-2xl font-black text-orange-500">{preFermentPct}<span className="text-sm font-semibold text-gray-400 ml-1">%</span></span>
              </div>
              <Curseur min={20} max={fermentation === 'biga' ? 70 : 60} step={5} valeur={preFermentPct} onChange={setPreFermentPct}
                accent="accent-orange-500" etiquetteMin="20 %" etiquetteMax={fermentation === 'biga' ? '70 %' : '60 %'} />
              <p className="text-xs text-gray-400 mt-1 text-center">{fermentation === 'biga' ? 'Recommandé : 40–60 %' : 'Recommandé : 25–40 %'}</p>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-semibold text-gray-700 text-sm">Température {fermentation === 'biga' ? 'biga' : 'poolish'}</span>
                <span className="text-2xl font-black text-amber-600">{tempPreFerment}<span className="text-sm font-semibold text-gray-400 ml-1">°C</span></span>
              </div>
              <Curseur min={4} max={24} step={1} valeur={tempPreFerment} onChange={setTempPreFerment}
                accent="accent-amber-500" etiquetteMin="4 °C (frigo)" etiquetteMax="24 °C" />
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-semibold text-gray-700 text-sm">Durée {fermentation === 'biga' ? 'biga' : 'poolish'}</span>
                <span className="text-2xl font-black text-amber-600">{heuresPreFerment}<span className="text-sm font-semibold text-gray-400 ml-1">h</span></span>
              </div>
              <Curseur min={heuresPreFermentMin} max={heuresPreFermentMax} step={heuresPreFermentStep}
                valeur={heuresPreFerment} onChange={setHeuresPreFerment}
                accent="accent-amber-500" etiquetteMin={`${heuresPreFermentMin} h`} etiquetteMax={`${heuresPreFermentMax} h`} />
            </div>
          </div>
        )}

        <button
          onClick={() => { setFrigo(f => !f); if (!frigo && heures < 12) setHeures(24); }}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all ${frigo ? 'bg-cyan-50 border-cyan-400 text-cyan-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧊</span>
            <div className="text-left">
              <div className="font-bold text-sm">{fermentation !== 'direct' ? 'Pâte finale au frigo' : 'Fermentation longue au frigo'}</div>
              <div className="text-xs opacity-70">Température fixée à 4 °C — jusqu'à 120 h</div>
            </div>
          </div>
          <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${frigo ? 'bg-cyan-400' : 'bg-gray-300'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${frigo ? 'translate-x-4' : ''}`} />
          </div>
        </button>
      </div>

      {/* Paramètres pâte */}
      <div className="bg-white rounded-3xl shadow-sm p-5 space-y-6">
        <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest">
          {fermentation !== 'direct' ? '② Paramètres pâte finale' : 'Paramètres'}
        </h2>

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
            <span className="text-4xl font-black text-orange-500">{poidsPaton}<span className="text-lg font-semibold text-gray-400 ml-1">g</span></span>
          </div>
          <Curseur min={150} max={400} step={10} valeur={poidsPaton} onChange={setPoidsPaton}
            accent="accent-orange-500" etiquetteMin="150 g" etiquetteMax="400 g" />
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-semibold text-gray-700">Hydratation</span>
            <span className="text-4xl font-black text-blue-500">{hydratation}<span className="text-lg font-semibold text-gray-400 ml-1">%</span></span>
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
              <span className="font-semibold text-gray-700">{fermentation !== 'direct' ? 'Température pâte finale' : 'Température ambiante'}</span>
              <span className="text-4xl font-black text-red-500">{temperature}<span className="text-lg font-semibold text-gray-400 ml-1">°C</span></span>
            </div>
            <Curseur min={16} max={30} step={1} valeur={temperature} onChange={setTemperature}
              accent="accent-red-500" etiquetteMin="16 °C" etiquetteMax="30 °C" />
          </div>
        )}

        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-semibold text-gray-700">{fermentation !== 'direct' ? 'Repos pâte finale' : 'Temps de repos'}</span>
            <span className={`text-4xl font-black ${frigo ? 'text-cyan-600' : 'text-green-600'}`}>
              {heuresClamped}<span className="text-lg font-semibold text-gray-400 ml-1">h</span>
            </span>
          </div>
          <Curseur min={frigo ? 12 : 2} max={heuresMax} step={frigo ? 4 : 1}
            valeur={heuresClamped} onChange={v => setHeures(v)}
            accent={frigo ? 'accent-cyan-500' : 'accent-green-500'}
            etiquetteMin={frigo ? '12 h' : '2 h'} etiquetteMax={frigo ? '120 h (5 jours)' : '72 h'} />
        </div>
      </div>

      {/* Résultats directe */}
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
              unite="g" bg="bg-yellow-50" text="text-yellow-800" border="border-yellow-200"
            />
            <p className="text-xs text-gray-400 text-center mt-2">Levure sèche = levure fraîche ÷ 3</p>
          </div>
        </div>
      )}

      {/* Résultats biga */}
      {fermentation === 'biga' && (
        <>
          <div className={`border-2 rounded-3xl p-5 space-y-3 ${frigo ? 'bg-cyan-50 border-cyan-300' : 'bg-orange-50 border-orange-300'}`}>
            <div className="flex justify-between items-center">
              <h2 className={`text-base font-bold uppercase tracking-widest ${frigo ? 'text-cyan-700' : 'text-orange-700'}`}>① Biga</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${frigo ? 'bg-cyan-200 text-cyan-700' : 'bg-orange-200 text-orange-700'}`}>{tempPreFerment} °C · {heuresPreFerment} h</span>
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
              <div className="flex items-center gap-2"><span className="text-2xl">🫙</span><span className="font-semibold text-orange-800">Biga (intégralité)</span></div>
              <span className="text-lg font-bold text-orange-600">≈ {res.bigaTotal} g</span>
            </div>
            <LigneIngredient emoji="🌾" label="Farine restante" valeur={res.finalFarine} unite="g"  bg="bg-amber-50" text="text-amber-800" border="border-amber-200" />
            <LigneIngredient emoji="💧" label="Eau restante"    valeur={res.finalEau}    unite="ml" bg="bg-blue-50"  text="text-blue-800"  border="border-blue-200" />
            <LigneIngredient emoji="🧂" label="Sel"             valeur={res.sel}         unite="g"  bg="bg-gray-50"  text="text-gray-700"  border="border-gray-200" />
            <p className="text-xs text-gray-400 text-center">Pas de levure supplémentaire — la biga suffit.</p>
          </div>
        </>
      )}

      {/* Résultats poolish */}
      {fermentation === 'poolish' && (
        <>
          <div className={`border-2 rounded-3xl p-5 space-y-3 ${frigo ? 'bg-cyan-50 border-cyan-300' : 'bg-blue-50 border-blue-300'}`}>
            <div className="flex justify-between items-center">
              <h2 className={`text-base font-bold uppercase tracking-widest ${frigo ? 'text-cyan-700' : 'text-blue-700'}`}>① Poolish</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${frigo ? 'bg-cyan-200 text-cyan-700' : 'bg-blue-200 text-blue-700'}`}>{tempPreFerment} °C · {heuresPreFerment} h</span>
            </div>
            <LigneIngredient emoji="🌾" label="Farine"      valeur={res.poolFarine} unite="g"  bg="bg-white" text="text-amber-800" border="border-amber-200" />
            <LigneIngredient emoji="💧" label="Eau (100 %)" valeur={res.poolEau}    unite="ml" bg="bg-white" text="text-blue-800"  border="border-blue-200" />
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
              <div className="flex items-center gap-2"><span className="text-2xl">🫙</span><span className="font-semibold text-blue-800">Poolish (intégralité)</span></div>
              <span className="text-lg font-bold text-blue-600">≈ {res.poolTotal} g</span>
            </div>
            <LigneIngredient emoji="🌾" label="Farine restante" valeur={res.finalFarine} unite="g"  bg="bg-amber-50" text="text-amber-800" border="border-amber-200" />
            <LigneIngredient emoji="💧" label="Eau restante"    valeur={res.finalEau}    unite="ml" bg="bg-blue-50"  text="text-blue-800"  border="border-blue-200" />
            <LigneIngredient emoji="🧂" label="Sel"             valeur={res.sel}         unite="g"  bg="bg-gray-50"  text="text-gray-700"  border="border-gray-200" />
            <p className="text-xs text-gray-400 text-center">Pas de levure supplémentaire — la poolish suffit.</p>
          </div>
        </>
      )}

      {/* Conseil */}
      <div className={`border rounded-3xl px-5 py-4 ${frigo ? 'bg-cyan-50 border-cyan-200' : 'bg-orange-50 border-orange-200'}`}>
        <p className={`text-sm ${frigo ? 'text-cyan-800' : 'text-orange-800'}`}>
          <span className="font-bold">{frigo ? '🧊 ' : '💡 '}Conseil : </span>{tip}
        </p>
      </div>

      {/* Instructions */}
      <SectionInstructions groupes={etapes({ res, nbPizzas, poidsPaton, heures: heuresClamped, temperature: tempEffective, frigo, fermentation, tempPreFerment, heuresPreFerment })} />

      {/* Installer */}
      <div className="bg-white rounded-3xl shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-2">📱 Installer sur iPhone</h3>
        <ol className="list-decimal list-inside space-y-1 text-xs text-gray-500">
          <li>Ouvrez dans <strong>Safari</strong></li>
          <li>Appuyez sur <strong>Partager ⬆️</strong></li>
          <li>Choisissez <strong>« Sur l'écran d'accueil »</strong></li>
        </ol>
      </div>
    </div>
  );
}

// ─── Calculateur Pain ─────────────────────────────────────────────────────────
function PainCalculator() {
  const [nbPains,          setNbPains]          = useState(2);
  const [poidsPain,        setPoidsPain]        = useState(700);
  const [hydratation,      setHydratation]      = useState(72);
  const [sel,              setSel]              = useState(2.0);
  const [fermentation,     setFermentation]     = useState('levain');
  const [levainPct,        setLevainPct]        = useState(20);
  const [heuresLevain,     setHeuresLevain]     = useState(8);
  const [preFermentPct,    setPreFermentPct]    = useState(30);
  const [tempPreFerment,   setTempPreFerment]   = useState(20);
  const [heuresPreFerment, setHeuresPreFerment] = useState(12);
  const [tempPointage,     setTempPointage]     = useState(24);
  const [heuresPointage,   setHeuresPointage]   = useState(4);
  const [frigoApprêt,      setFrigoApprêt]      = useState(false);
  const [heuresApprêt,     setHeuresApprêt]     = useState(2);
  const [typeYeast,        setTypeYeast]        = useState('seche');
  const [heureCuisson,     setHeureCuisson]     = useState('');
  const [jourCuisson,      setJourCuisson]      = useState(0);

  const res = useMemo(
    () => calculerPain({ nbPains, poidsPain, hydratation, sel, fermentation, levainPct, preFermentPct, tempPreFerment, heuresPreFerment, tempPointage, heuresPointage, heuresApprêt, frigoApprêt }),
    [nbPains, poidsPain, hydratation, sel, fermentation, levainPct, preFermentPct, tempPreFerment, heuresPreFerment, tempPointage, heuresPointage, heuresApprêt, frigoApprêt]
  );

  const tip = useMemo(
    () => conseilPain({ fermentation, hydratation, frigoApprêt }),
    [fermentation, hydratation, frigoApprêt]
  );

  const planning = useMemo(() => {
    if (!heureCuisson) return null;
    const [h, m] = heureCuisson.split(':').map(Number);
    const cuisson = new Date();
    cuisson.setDate(cuisson.getDate() + jourCuisson);
    cuisson.setHours(h, m, 0, 0);

    const PRECHAUFFAGE_MS = 60 * 60000;
    const prechauffage    = new Date(cuisson.getTime() - PRECHAUFFAGE_MS);
    const faconnage       = new Date(prechauffage.getTime() - heuresApprêt * 3600000);
    const debutPointage   = new Date(faconnage.getTime() - heuresPointage * 3600000);

    const arr = [];

    if (fermentation === 'levain') {
      const debutLevain = new Date(debutPointage.getTime() - heuresLevain * 3600000 - 30 * 60000);
      arr.push({ label: 'Rafraîchir le levain', emoji: '🌱', date: debutLevain });
      arr.push({ label: 'Autolyse + pétrissage', emoji: '🌾', date: new Date(debutPointage.getTime() - 30 * 60000) });
    } else if (fermentation === 'poolish') {
      const debutPool = new Date(debutPointage.getTime() - heuresPreFerment * 3600000 - 30 * 60000);
      arr.push({ label: 'Préparer la poolish', emoji: '🔵', date: debutPool });
      arr.push({ label: 'Pétrissage', emoji: '🌾', date: new Date(debutPointage.getTime() - 30 * 60000) });
    } else {
      arr.push({ label: 'Pétrissage', emoji: '🌾', date: new Date(debutPointage.getTime() - 30 * 60000) });
    }

    arr.push({ label: `Pointage (${heuresPointage} h)`, emoji: '⏳', date: debutPointage });
    arr.push({ label: frigoApprêt ? `Façonnage + apprêt frigo (${heuresApprêt} h)` : `Façonnage + apprêt (${heuresApprêt} h)`, emoji: '🍞', date: faconnage });
    arr.push({ label: 'Préchauffage four + cocotte', emoji: '🔥', date: prechauffage });
    arr.push({ label: 'Inciser + enfourner', emoji: '🫓', date: cuisson, isCuisson: true });

    return arr;
  }, [heureCuisson, jourCuisson, fermentation, heuresLevain, heuresPreFerment, heuresPointage, heuresApprêt, frigoApprêt]);

  function choisirFermentation(id) {
    setFermentation(id);
    if (id === 'levain')  { setLevainPct(20); setHeuresLevain(8); }
    if (id === 'poolish') { setPreFermentPct(30); setTempPreFerment(20); setHeuresPreFerment(12); }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-10">

      <SectionHeureCuisson
        heureCuisson={heureCuisson} setHeureCuisson={setHeureCuisson}
        jourCuisson={jourCuisson}   setJourCuisson={setJourCuisson}
      />

      <SectionPlanning planning={planning} />

      {/* Fermentation */}
      <div className="bg-white rounded-3xl shadow-sm p-5">
        <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest mb-3">Fermentation</h2>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-4">
          {[{ id: 'levain', label: 'Levain' }, { id: 'direct', label: 'Levure' }, { id: 'poolish', label: 'Poolish' }].map(({ id, label }) => (
            <button key={id} onClick={() => choisirFermentation(id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${fermentation === id ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>

        {fermentation === 'levain' && (
          <div className="bg-amber-50 rounded-2xl p-4 mb-4 space-y-5">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Paramètres levain</p>
            <p className="text-xs text-gray-500 -mt-2">Levain naturel 100 % hydratation. Rafraîchissez-le la veille ou le matin.</p>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-semibold text-gray-700 text-sm">Quantité de levain</span>
                <span className="text-2xl font-black text-amber-600">{levainPct}<span className="text-sm font-semibold text-gray-400 ml-1">%</span></span>
              </div>
              <Curseur min={10} max={40} step={5} valeur={levainPct} onChange={setLevainPct}
                accent="accent-amber-500" etiquetteMin="10 % (lent)" etiquetteMax="40 % (rapide)" />
              <p className="text-xs text-gray-400 mt-1 text-center">Recommandé : 15–25 %</p>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-semibold text-gray-700 text-sm">Durée rafraîchi levain</span>
                <span className="text-2xl font-black text-amber-600">{heuresLevain}<span className="text-sm font-semibold text-gray-400 ml-1">h</span></span>
              </div>
              <Curseur min={4} max={16} step={1} valeur={heuresLevain} onChange={setHeuresLevain}
                accent="accent-amber-500" etiquetteMin="4 h" etiquetteMax="16 h" />
            </div>
          </div>
        )}

        {fermentation === 'poolish' && (
          <div className="bg-blue-50 rounded-2xl p-4 mb-4 space-y-5">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Paramètres poolish</p>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-semibold text-gray-700 text-sm">Farine dans la poolish</span>
                <span className="text-2xl font-black text-blue-600">{preFermentPct}<span className="text-sm font-semibold text-gray-400 ml-1">%</span></span>
              </div>
              <Curseur min={20} max={60} step={5} valeur={preFermentPct} onChange={setPreFermentPct}
                accent="accent-blue-500" etiquetteMin="20 %" etiquetteMax="60 %" />
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-semibold text-gray-700 text-sm">Température poolish</span>
                <span className="text-2xl font-black text-blue-600">{tempPreFerment}<span className="text-sm font-semibold text-gray-400 ml-1">°C</span></span>
              </div>
              <Curseur min={4} max={24} step={1} valeur={tempPreFerment} onChange={setTempPreFerment}
                accent="accent-blue-500" etiquetteMin="4 °C" etiquetteMax="24 °C" />
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="font-semibold text-gray-700 text-sm">Durée poolish</span>
                <span className="text-2xl font-black text-blue-600">{heuresPreFerment}<span className="text-sm font-semibold text-gray-400 ml-1">h</span></span>
              </div>
              <Curseur min={4} max={24} step={1} valeur={heuresPreFerment} onChange={setHeuresPreFerment}
                accent="accent-blue-500" etiquetteMin="4 h" etiquetteMax="24 h" />
            </div>
          </div>
        )}
      </div>

      {/* Paramètres */}
      <div className="bg-white rounded-3xl shadow-sm p-5 space-y-6">
        <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest">Paramètres</h2>

        <div>
          <div className="flex justify-between items-baseline mb-3">
            <span className="font-semibold text-gray-700">Nombre de pains</span>
            <span className="text-4xl font-black text-amber-600">{nbPains}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setNbPains(v => Math.max(1, v - 1))}
              className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 text-2xl font-bold flex items-center justify-center active:bg-amber-200">−</button>
            <input type="range" min={1} max={8} value={nbPains}
              onChange={e => setNbPains(Number(e.target.value))}
              className="flex-1 accent-amber-500"
              style={{ background: `linear-gradient(to right, #d97706 ${((nbPains-1)/7)*100}%, #e5e7eb ${((nbPains-1)/7)*100}%)` }}
            />
            <button onClick={() => setNbPains(v => Math.min(8, v + 1))}
              className="w-11 h-11 rounded-full bg-amber-100 text-amber-700 text-2xl font-bold flex items-center justify-center active:bg-amber-200">+</button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-semibold text-gray-700">Poids par pain</span>
            <span className="text-4xl font-black text-amber-600">{poidsPain}<span className="text-lg font-semibold text-gray-400 ml-1">g</span></span>
          </div>
          <Curseur min={400} max={1200} step={50} valeur={poidsPain} onChange={setPoidsPain}
            accent="accent-amber-500" etiquetteMin="400 g" etiquetteMax="1200 g" />
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-semibold text-gray-700">Hydratation</span>
            <span className="text-4xl font-black text-blue-500">{hydratation}<span className="text-lg font-semibold text-gray-400 ml-1">%</span></span>
          </div>
          <Curseur min={60} max={90} step={1} valeur={hydratation} onChange={setHydratation}
            accent="accent-blue-500" etiquetteMin="60 % (dense)" etiquetteMax="90 % (aérée)" />
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-semibold text-gray-700">Sel</span>
            <span className="text-4xl font-black text-gray-600">{sel.toFixed(1)}<span className="text-lg font-semibold text-gray-400 ml-1">%</span></span>
          </div>
          <Curseur min={1.5} max={2.5} step={0.1} valeur={sel} onChange={v => setSel(Math.round(v * 10) / 10)}
            accent="accent-gray-500" etiquetteMin="1,5 %" etiquetteMax="2,5 %" />
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-semibold text-gray-700">Température pointage</span>
            <span className="text-4xl font-black text-red-500">{tempPointage}<span className="text-lg font-semibold text-gray-400 ml-1">°C</span></span>
          </div>
          <Curseur min={18} max={30} step={1} valeur={tempPointage} onChange={setTempPointage}
            accent="accent-red-500" etiquetteMin="18 °C" etiquetteMax="30 °C" />
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-semibold text-gray-700">Durée du pointage</span>
            <span className="text-4xl font-black text-green-600">{heuresPointage}<span className="text-lg font-semibold text-gray-400 ml-1">h</span></span>
          </div>
          <Curseur min={2} max={8} step={0.5} valeur={heuresPointage} onChange={setHeuresPointage}
            accent="accent-green-500" etiquetteMin="2 h" etiquetteMax="8 h" />
        </div>

        {/* Apprêt */}
        <div>
          <button
            onClick={() => { setFrigoApprêt(f => !f); if (!frigoApprêt) setHeuresApprêt(12); else setHeuresApprêt(2); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all mb-4 ${
              frigoApprêt ? 'bg-cyan-50 border-cyan-400 text-cyan-700' : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧊</span>
              <div className="text-left">
                <div className="font-bold text-sm">{frigoApprêt ? 'Apprêt au frigo (retardé)' : 'Apprêt à température ambiante'}</div>
                <div className="text-xs opacity-70">{frigoApprêt ? 'Développe les arômes — incisez direct sorti du froid' : 'Cuisson le jour même'}</div>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${frigoApprêt ? 'bg-cyan-400' : 'bg-gray-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${frigoApprêt ? 'translate-x-4' : ''}`} />
            </div>
          </button>

          <div className="flex justify-between items-baseline mb-2">
            <span className="font-semibold text-gray-700">{frigoApprêt ? 'Durée apprêt frigo' : 'Durée apprêt'}</span>
            <span className={`text-4xl font-black ${frigoApprêt ? 'text-cyan-600' : 'text-purple-600'}`}>
              {heuresApprêt}<span className="text-lg font-semibold text-gray-400 ml-1">h</span>
            </span>
          </div>
          <Curseur
            min={frigoApprêt ? 8 : 1} max={frigoApprêt ? 20 : 5} step={frigoApprêt ? 1 : 0.5}
            valeur={heuresApprêt} onChange={setHeuresApprêt}
            accent={frigoApprêt ? 'accent-cyan-500' : 'accent-purple-500'}
            etiquetteMin={frigoApprêt ? '8 h' : '1 h'} etiquetteMax={frigoApprêt ? '20 h' : '5 h'}
          />
        </div>
      </div>

      {/* Résultats levain */}
      {res.type === 'levain' && (
        <>
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-amber-700 uppercase tracking-widest">① Levain</h2>
              <span className="text-xs bg-amber-200 text-amber-700 font-bold px-3 py-1 rounded-full">{levainPct} % · {heuresLevain} h</span>
            </div>
            <LigneIngredient emoji="🌾" label="Farine levain"  valeur={res.levainFarine} unite="g"  bg="bg-white" text="text-amber-800" border="border-amber-200" />
            <LigneIngredient emoji="💧" label="Eau levain"     valeur={res.levainEau}    unite="ml" bg="bg-white" text="text-blue-800"  border="border-blue-200" />
            <LigneIngredient emoji="🍯" label="Levain chef"    valeur={Math.round(res.levainPoids * 0.1)} unite="g" bg="bg-white" text="text-amber-700" border="border-amber-200" />
            <p className="text-xs text-gray-400 text-center">Levain chef = environ 10 % du poids de levain rafraîchi.</p>
          </div>
          <div className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest">② Pâte finale</h2>
              <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-3 py-1 rounded-full">{res.totalPate} g total</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl border bg-amber-50 border-amber-200">
              <div className="flex items-center gap-2"><span className="text-2xl">🫙</span><span className="font-semibold text-amber-800">Levain (tout)</span></div>
              <span className="text-lg font-bold text-amber-600">≈ {res.levainPoids} g</span>
            </div>
            <LigneIngredient emoji="🌾" label="Farine"  valeur={res.farineFinale} unite="g"  bg="bg-amber-50" text="text-amber-800" border="border-amber-200" />
            <LigneIngredient emoji="💧" label="Eau"     valeur={res.eauFinale}    unite="ml" bg="bg-blue-50"  text="text-blue-800"  border="border-blue-200" />
            <LigneIngredient emoji="🧂" label="Sel"     valeur={res.sel}          unite="g"  bg="bg-gray-50"  text="text-gray-700"  border="border-gray-200" />
          </div>
        </>
      )}

      {/* Résultats levure directe */}
      {res.type === 'direct' && (
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
              unite="g" bg="bg-yellow-50" text="text-yellow-800" border="border-yellow-200"
            />
          </div>
        </div>
      )}

      {/* Résultats poolish pain */}
      {res.type === 'poolish' && (
        <>
          <div className="bg-blue-50 border-2 border-blue-300 rounded-3xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-blue-700 uppercase tracking-widest">① Poolish</h2>
              <span className="text-xs bg-blue-200 text-blue-700 font-bold px-3 py-1 rounded-full">{tempPreFerment} °C · {heuresPreFerment} h</span>
            </div>
            <LigneIngredient emoji="🌾" label="Farine"      valeur={res.poolFarine} unite="g"  bg="bg-white" text="text-amber-800" border="border-amber-200" />
            <LigneIngredient emoji="💧" label="Eau (100 %)" valeur={res.poolEau}    unite="ml" bg="bg-white" text="text-blue-800"  border="border-blue-200" />
            <div className="pt-1">
              <ToggleYeast valeur={typeYeast} onChange={setTypeYeast} bgCls="bg-blue-100" />
              <LigneIngredient
                emoji={typeYeast === 'seche' ? '🟡' : '🟤'}
                label={typeYeast === 'seche' ? 'Levure sèche' : 'Levure fraîche'}
                valeur={typeYeast === 'seche' ? res.poolLevS : res.poolLevF}
                unite="g" bg="bg-white" text="text-yellow-800" border="border-yellow-200"
              />
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest">② Pâte finale</h2>
              <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-3 py-1 rounded-full">{res.totalPate} g total</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl border bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2"><span className="text-2xl">🫙</span><span className="font-semibold text-blue-800">Poolish (intégralité)</span></div>
              <span className="text-lg font-bold text-blue-600">≈ {res.poolTotal} g</span>
            </div>
            <LigneIngredient emoji="🌾" label="Farine restante" valeur={res.finalFarine} unite="g"  bg="bg-amber-50" text="text-amber-800" border="border-amber-200" />
            <LigneIngredient emoji="💧" label="Eau restante"    valeur={res.finalEau}    unite="ml" bg="bg-blue-50"  text="text-blue-800"  border="border-blue-200" />
            <LigneIngredient emoji="🧂" label="Sel"             valeur={res.sel}         unite="g"  bg="bg-gray-50"  text="text-gray-700"  border="border-gray-200" />
            <p className="text-xs text-gray-400 text-center">Pas de levure supplémentaire — la poolish suffit.</p>
          </div>
        </>
      )}

      {/* Conseil */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl px-5 py-4">
        <p className="text-sm text-amber-800">
          <span className="font-bold">💡 Conseil : </span>{tip}
        </p>
      </div>

      {/* Instructions */}
      <SectionInstructions groupes={etapesPain({ res, nbPains, poidsPain, fermentation, heuresPointage, tempPointage, heuresApprêt, frigoApprêt, heuresLevain })} />

      {/* Installer */}
      <div className="bg-white rounded-3xl shadow-sm p-5">
        <h3 className="font-bold text-gray-800 mb-2">📱 Installer sur iPhone</h3>
        <ol className="list-decimal list-inside space-y-1 text-xs text-gray-500">
          <li>Ouvrez dans <strong>Safari</strong></li>
          <li>Appuyez sur <strong>Partager ⬆️</strong></li>
          <li>Choisissez <strong>« Sur l'écran d'accueil »</strong></li>
        </ol>
      </div>
    </div>
  );
}

// ─── App wrapper avec toggle Pizza / Pain ─────────────────────────────────────
function App() {
  const [mode, setMode] = useState('pizza');

  return (
    <div className="min-h-screen bg-amber-50">
      {/* En-tête */}
      <div className="bg-gradient-to-br from-orange-500 to-red-600 px-5 pt-10 pb-6 shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-3xl font-extrabold text-white text-center tracking-tight">
            {mode === 'pizza' ? '🍕 Pizza Dough' : '🍞 Pain Maison'}
          </h1>
          <p className="text-orange-100 text-sm text-center mt-1">
            {mode === 'pizza' ? 'Calculateur de pâte à pizza' : 'Calculateur de pain artisanal'}
          </p>
          <div className="flex gap-2 bg-orange-600 bg-opacity-40 p-1 rounded-xl mt-4 max-w-xs mx-auto">
            <button onClick={() => setMode('pizza')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'pizza' ? 'bg-white text-orange-600' : 'text-orange-100'}`}>
              🍕 Pizza
            </button>
            <button onClick={() => setMode('pain')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'pain' ? 'bg-white text-orange-600' : 'text-orange-100'}`}>
              🍞 Pain
            </button>
          </div>
        </div>
      </div>

      {mode === 'pizza' ? <PizzaCalculator /> : <PainCalculator />}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
