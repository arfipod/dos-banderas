type Language = 'en' | 'es';

interface RulesReferenceProps {
  lang: Language;
}

const CONTENT = {
  en: {
    title: 'Rules Reference',
    objective: 'Objective',
    objectiveText:
      'Complete five Life Trials and then overcome the Final Choice. You win with Communion 5+, Attachment below 7, and a successful Final Choice. Communion 7+ is a full victory: One in God.',
    roundStructure: 'Round Structure',
    steps: [
      'Reveal one Life Trial.',
      'Reveal one Dark Banner card.',
      "Choose Christ's Banner or accept the shortcut.",
      'Play up to four cards.',
      'Adjust conditional effects manually.',
      'Resolve Light × Fervor against Darkness.',
      'Buy from the Church Row.',
    ],
    resolution: 'Resolution',
    clean: 'Clean Victory: +1 Communion and +3 Fruits.',
    mixed: 'Mixed Victory: +2 Fruits and +1 Attachment.',
    examen: 'Failure with Examen: +1 Desolation, +1 Consolation, +1 Fruit.',
    closed: 'Closed Failure: +1 Desolation.',
  },
  es: {
    title: 'Referencia de reglas',
    objective: 'Objetivo',
    objectiveText:
      'Completa cinco Pruebas de Vida y luego supera la Elección Final. Ganas con Comunión 5+, Apego por debajo de 7 y una Elección Final superada. Comunión 7+ es victoria total: Uno en Dios.',
    roundStructure: 'Estructura de ronda',
    steps: [
      'Revela una Prueba de Vida.',
      'Revela una carta de Bandera Oscura.',
      'Elige la Bandera de Cristo o acepta el atajo.',
      'Juega hasta cuatro cartas.',
      'Ajusta manualmente los efectos condicionales.',
      'Resuelve Luz × Fervor contra Oscuridad.',
      'Compra en la Fila de Iglesia.',
    ],
    resolution: 'Resolución',
    clean: 'Victoria limpia: +1 Comunión y +3 Frutos.',
    mixed: 'Victoria mixta: +2 Frutos y +1 Apego.',
    examen: 'Fracaso con Examen: +1 Desolación, +1 Consolación, +1 Fruto.',
    closed: 'Fracaso cerrado: +1 Desolación.',
  },
} as const;

export function RulesReference({ lang }: RulesReferenceProps) {
  const t = CONTENT[lang];
  return (
    <section className="panel rules-reference">
      <h2>{t.title}</h2>
      <div className="rules-grid">
        <div>
          <h3>{t.objective}</h3>
          <p>{t.objectiveText}</p>
        </div>
        <div>
          <h3>{t.roundStructure}</h3>
          <ol>
            {t.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>
        <div>
          <h3>{t.resolution}</h3>
          <p>{t.clean}</p>
          <p>{t.mixed}</p>
          <p>{t.examen}</p>
          <p>{t.closed}</p>
        </div>
      </div>
    </section>
  );
}
