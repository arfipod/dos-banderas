import type { Card } from '../types/cards';

export type Language = 'en' | 'es';

const exactTranslations: Record<string, string> = {
  Starter: 'Inicial',
  'Capital Sin': 'Pecado Capital',
  Virtue: 'Virtud',
  'Gift of the Holy Spirit': 'Don del Espíritu Santo',
  Sacrament: 'Sacramento',
  'Dark Banner': 'Bandera Oscura',
  Mystery: 'Misterio',
  Ally: 'Aliado',
  'Weapon of Light': 'Arma de Luz',
  'Life Trial': 'Prueba de Vida',
  Discernment: 'Discernimiento',
  'Practical Charity': 'Caridad Práctica',
  Combat: 'Combate',
  Wound: 'Herida',
  Temptation: 'Tentación',
  Response: 'Respuesta',
  'Actual Grace': 'Gracia Actual',
  'Channel of Grace': 'Canal de Gracia',
  Enemy: 'Enemigo',
  Trinity: 'Trinidad',
  'Saint / Angel / Church': 'Santo / Angel / Iglesia',
  'Spiritual Practice': 'Practica espiritual',
  Quest: 'Desafio',
  Prayer: 'Oración',
  Watchfulness: 'Vigilancia',
  Service: 'Servicio',
  Fortitude: 'Fortaleza',
  Sin: 'Pecado',
  Trial: 'Prueba',
  Light: 'Luz',
  Fervor: 'Fervor',
  Attachment: 'Apego',
  Desolation: 'Desolación',
  Consolation: 'Consolación',
  Communion: 'Comunión',
  Fruit: 'Fruto',
  Fruits: 'Frutos',
  Gift: 'Don',
  Gifts: 'Dones',
  Weapon: 'Arma',
  World: 'Mundo',
  Devil: 'Demonio',
  Flesh: 'Carne',
  Shortcut: 'Atajo',
  Darkness: 'Oscuridad',
  'Final Choice': 'Elección Final',
  'Clean Victory': 'Victoria limpia',
  'Mixed Victory': 'Victoria mixta',
  'Failure with Examen': 'Fallo con Examen',
  'Closed Failure': 'Fallo cerrado',
  'Simple Prayer': 'Oración sencilla',
  Attention: 'Atención',
  Resistance: 'Resistencia',
  'Brief Examen': 'Examen breve',
  Fragility: 'Fragilidad',
  Pride: 'Soberbia',
  Greed: 'Avaricia',
  Lust: 'Lujuria',
  Wrath: 'Ira',
  Gluttony: 'Gula',
  Envy: 'Envidia',
  Sloth: 'Pereza',
  Humility: 'Humildad',
  Generosity: 'Generosidad',
  Chastity: 'Castidad',
  Patience: 'Paciencia',
  Temperance: 'Templanza',
  Charity: 'Caridad',
  Diligence: 'Diligencia',
  Wisdom: 'Sabiduría',
  Understanding: 'Entendimiento',
  Counsel: 'Consejo',
  Piety: 'Piedad',
  'Fear of the Lord': 'Temor del Señor',
  Baptism: 'Bautismo',
  Confirmation: 'Confirmación',
  Eucharist: 'Eucaristía',
  Reconciliation: 'Reconciliación',
  'Anointing of the Sick': 'Unción de los enfermos',
  'Holy Orders': 'Orden sagrado',
  Matrimony: 'Matrimonio',
  Father: 'Padre',
  Son: 'Hijo',
  'Holy Spirit': 'Espíritu Santo',
  'Most Holy Trinity': 'Santísima Trinidad',
  'Guardian Angel': 'Ángel de la Guarda',
  'Saint Michael the Archangel': 'San Miguel Arcángel',
  'Saint Raphael the Archangel': 'San Rafael Arcángel',
  'Saint Gabriel the Archangel': 'San Gabriel Arcángel',
  'Saint Ignatius of Loyola': 'San Ignacio de Loyola',
  'Saint Teresa of Jesus': 'Santa Teresa de Jesús',
  'Saint Francis of Assisi': 'San Francisco de Asís',
  'Saint Joseph': 'San José',
  'Saint Monica': 'Santa Monica',
  'Holy Catholic Church': 'Santa Iglesia Católica',
  'Communion of Saints': 'Comunión de los Santos',
  'Mary, Mother of the Church': 'María, Madre de la Iglesia',
  Fasting: 'Ayuno',
  Abstinence: 'Abstinencia',
  Examen: 'Examen',
  Word: 'Palabra',
  Almsgiving: 'Limosna',
  Silence: 'Silencio',
  Perseverance: 'Perseverancia',
  'You are corrected in front of others': 'Te corrigen delante de otros',
  'Someone receives the recognition you wanted': 'Alguien recibe el reconocimiento que querias',
  'You have extra money and someone needs help': 'Tienes dinero de sobra y alguien necesita ayuda',
  'You are tired and it is time to pray': 'Estas cansado y es hora de orar',
  'You receive a humiliation': 'Recibes una humillacion',
  'An image or memory disorders your desire': 'Una imagen o recuerdo desordena tu deseo',
  'You eat, buy, or scroll too much to avoid emptiness': 'Comes, compras o navegas demasiado para evitar el vacio',
  'Choose between looking good and telling the truth': 'Elige entre quedar bien y decir la verdad',
  'You must ask for forgiveness first': 'Debes pedir perdon primero',
  'A small task feels heavy': 'Una tarea pequena se siente pesada',
  'You are provoked in conversation': 'Te provocan en una conversacion',
  'You see someone fall and can judge them': 'Ves caer a alguien y puedes juzgarlo',
  'You can serve without being seen': 'Puedes servir sin que te vean',
  'Noise prevents you from listening': 'El ruido te impide escuchar',
  'You must discern an important decision': 'Debes discernir una decision importante',
  'An old wound is triggered': 'Se activa una herida antigua',
  'You can manipulate a small truth': 'Puedes manipular una pequena verdad',
  'The body asks for immediate comfort': 'El cuerpo pide consuelo inmediato',
  'You feel dryness in prayer': 'Sientes sequedad en la oracion',
  'You must rejoice for another person': 'Debes alegrarte por otra persona',
  'You are offered unjust gain': 'Te ofrecen una ganancia injusta',
  'The community needs you': 'La comunidad te necesita',
  'You compare yourself with your ideal life': 'Te comparas con tu vida ideal',
  'Final Choice: under which banner will you live?': 'Eleccion Final: bajo que bandera viviras?',
};

const textTranslations: Record<string, string> = {
  'If played before a Gift this round, that Gift gains +1 Fervor.':
    'Si se juega antes de un Don en esta ronda, ese Don gana +1 Fervor.',
  'Look at the top card of your deck. You may discard it.':
    'Mira la carta superior de tu mazo. Puedes descartarla.',
  'In cooperative play, the companion may contribute one additional card this round.':
    'En cooperativo, el companero puede aportar una carta adicional en esta ronda.',
  'Cancel -1 Light caused by World, Devil, or Flesh.':
    'Cancela -1 Luz causada por Mundo, Demonio o Carne.',
  'If you fail this Trial, treat it as a Failure with Examen.':
    'Si fallas esta Prueba, tratala como un Fallo con Examen.',
  'Clutters your hand. It may be removed by purification effects.':
    'Estorba tu mano. Puede eliminarse con efectos de purificacion.',
  'Shortcut: +5 Light this round, but +1 Attachment. Humility may purify this card.':
    'Atajo: +5 Luz esta ronda, pero +1 Apego. Humildad puede purificar esta carta.',
  'Shortcut: gain +1 Fruit, but +1 Attachment. Generosity may purify this card.':
    'Atajo: gana +1 Fruto, pero +1 Apego. Generosidad puede purificar esta carta.',
  'Shortcut: draw 2 cards, but +1 Attachment. Chastity may purify this card.':
    'Atajo: roba 2 cartas, pero +1 Apego. Castidad puede purificar esta carta.',
  'Shortcut: +4 Light, but +1 Desolation. Patience may purify this card.':
    'Atajo: +4 Luz, pero +1 Desolacion. Paciencia puede purificar esta carta.',
  'Shortcut: heal 1 Desolation now, but +1 Attachment. Temperance may purify this card.':
    'Atajo: sana 1 Desolacion ahora, pero +1 Apego. Templanza puede purificar esta carta.',
  'Shortcut: draw 1 card and gain +3 Light, but add Envy to your discard. Charity may purify this card.':
    'Atajo: roba 1 carta y gana +3 Luz, pero anade Envidia a tus descartes. Caridad puede purificar esta carta.',
  'Shortcut: avoid effort, but +1 Desolation. Diligence may purify this card.':
    'Atajo: evita el esfuerzo, pero +1 Desolacion. Diligencia puede purificar esta carta.',
  'Against Pride, add +4 Light manually and you may purify one Pride.':
    'Contra Soberbia, anade +4 Luz manualmente y puedes purificar una Soberbia.',
  'Against Greed, add +4 Light manually. You may spend 1 Fruit to gain +1 Communion if you succeed.':
    'Contra Avaricia, anade +4 Luz manualmente. Puedes gastar 1 Fruto para ganar +1 Comunion si tienes exito.',
  'Against Lust, add +4 Light manually. Cancel one Lust or Flesh temptation.':
    'Contra Lujuria, anade +4 Luz manualmente. Cancela una tentacion de Lujuria o Carne.',
  'Against Wrath, add +4 Light manually. Ignore one reactive penalty.':
    'Contra Ira, anade +4 Luz manualmente. Ignora una penalizacion reactiva.',
  'Against Gluttony, add +4 Light manually. Fasting and Abstinence gain +1 Light this round.':
    'Contra Gula, anade +4 Luz manualmente. Ayuno y Abstinencia ganan +1 Luz esta ronda.',
  'Against Envy, add +4 Light manually. In cooperative play, the companion gains +1 Consolation.':
    'Contra Envidia, anade +4 Luz manualmente. En cooperativo, el companero gana +1 Consolacion.',
  'Against Sloth, add +4 Light manually. You may play one additional card this round.':
    'Contra Pereza, anade +4 Luz manualmente. Puedes jugar una carta adicional esta ronda.',
  "If you did not accept a shortcut this round, you may manually double this card's extra Fervor.":
    'Si no aceptaste un atajo esta ronda, puedes duplicar manualmente el Fervor extra de esta carta.',
  'Reveal or cancel confusion. Gain +1 Fervor.': 'Revela o cancela confusion. Gana +1 Fervor.',
  'Change the main sin of the Trial. Gain +1 Fervor.':
    'Cambia el pecado principal de la Prueba. Gana +1 Fervor.',
  'Ignore one penalty from Flesh or Desolation. Gain +1 Fervor.':
    'Ignora una penalizacion de Carne o Desolacion. Gana +1 Fervor.',
  'Look at the next 3 cards of your deck. Gain +1 Fervor.':
    'Mira las proximas 3 cartas de tu mazo. Gana +1 Fervor.',
  'Heal 1 Desolation. Gain +1 Fervor.': 'Sana 1 Desolacion. Gana +1 Fervor.',
  'Reject a revealed temptation. If it was strong, gain +1 Consolation and +1 Fervor manually.':
    'Rechaza una tentacion revelada. Si era fuerte, gana +1 Consolacion y +1 Fervor manualmente.',
  'Permanently remove 1 Fragility or Sin from your deck or discard.':
    'Elimina permanentemente 1 Fragilidad o Pecado de tu mazo o descartes.',
  'During this and the next round, Gifts give +1 extra Fervor manually.':
    'Durante esta ronda y la siguiente, los Dones dan +1 Fervor extra manualmente.',
  'Recover one card used this round. If there was accompaniment, gain +1 Communion.':
    'Recupera una carta usada esta ronda. Si hubo acompanamiento, gana +1 Comunion.',
  'Purify 1 Sin. Convert a failure into a Failure with Examen.':
    'Purifica 1 Pecado. Convierte un fallo en un Fallo con Examen.',
  'Convert up to 2 Desolation into Light this round.':
    'Convierte hasta 2 Desolacion en Luz esta ronda.',
  'The next purchase from the Church Row costs 1 less.':
    'La proxima compra de la Fila de Iglesia cuesta 1 menos.',
  'In cooperative play, both players share +1 Fervor. In solo play, gain +2 Light manually.':
    'En cooperativo, ambos jugadores comparten +1 Fervor. En solitario, gana +2 Luz manualmente.',
  'If you do not play a Virtue this round, gain +1 Attachment.':
    'Si no juegas una Virtud esta ronda, gana +1 Apego.',
  'The first Virtue played this round does not count unless you play Examen or Understanding.':
    'La primera Virtud jugada esta ronda no cuenta salvo que juegues Examen o Entendimiento.',
  'You may only play 2 cards unless you play Prayer, Fasting, or Temperance.':
    'Solo puedes jugar 2 cartas salvo que juegues Oracion, Ayuno o Templanza.',
  'Lower Attachment by 1 or cancel World. Order the next cards.':
    'Reduce Apego en 1 o cancela Mundo. Ordena las proximas cartas.',
  'Turn one consequence into offering. A purified Sin gives double Light this round.':
    'Convierte una consecuencia en ofrenda. Un Pecado purificado da el doble de Luz esta ronda.',
  'Copy a Gift already played. Heal 1 Desolation.': 'Copia un Don ya jugado. Sana 1 Desolacion.',
  'If Communion is 7+, overcome the Final Choice.': 'Si Comunion es 7+, supera la Eleccion Final.',
  'When you draw a Sin, you may place it on top or bottom of your deck.':
    'Cuando robes un Pecado, puedes colocarlo arriba o abajo de tu mazo.',
  'Against Devil, gain +2 Light and +1 Fervor manually.':
    'Contra Demonio, gana +2 Luz y +1 Fervor manualmente.',
  'When you heal Desolation, gain +1 Fruit.': 'Cuando sanes Desolacion, gana +1 Fruto.',
  'Look at another Trial and choose which one to face.': 'Mira otra Prueba y elige cual enfrentar.',
  'When you play Examen, gain +1 Fervor. If you reject a shortcut, gain +2 Light manually.':
    'Cuando juegues Examen, gana +1 Fervor. Si rechazas un atajo, gana +2 Luz manualmente.',
  'If you have Desolation, Prayer gives +2 Light manually.':
    'Si tienes Desolacion, Oracion da +2 Luz manualmente.',
  'With Generosity, you may lose 1 Fruit to lower Attachment by 1.':
    'Con Generosidad, puedes perder 1 Fruto para reducir Apego en 1.',
  'Diligence and Silence count against Sloth.': 'Diligencia y Silencio cuentan contra Pereza.',
  'If you fail a Trial, keep one card for the next round.':
    'Si fallas una Prueba, conserva una carta para la proxima ronda.',
  'You may refresh one card in the Church Row. Sacraments cost 1 less manually.':
    'Puedes renovar una carta de la Fila de Iglesia. Los Sacramentos cuestan 1 menos manualmente.',
  'Use a Saint or Angel from your discard as +2 Light manually.':
    'Usa un Santo o Angel de tus descartes como +2 Luz manualmente.',
  'Once per game, convert Desolation into Consolation.':
    'Una vez por partida, convierte Desolacion en Consolacion.',
  'If played before a Gift, add +1 Fervor manually.':
    'Si se juega antes de un Don, anade +1 Fervor manualmente.',
  'Cancel Flesh or Gluttony. You may play one fewer card to gain +1 Fervor.':
    'Cancela Carne o Gula. Puedes jugar una carta menos para ganar +1 Fervor.',
  'Cancel Lust or Gluttony. Otherwise, prepare +2 Light for the next round.':
    'Cancela Lujuria o Gula. Si no, prepara +2 Luz para la proxima ronda.',
  'Reveal a lie. If you fail, count it as Failure with Examen.':
    'Revela una mentira. Si fallas, cuenta como Fallo con Examen.',
  'Return a Virtue from your discard to your hand.':
    'Devuelve una Virtud de tus descartes a tu mano.',
  'Spend 1 Fruit to gain +1 Communion against Greed or Envy.':
    'Gasta 1 Fruto para ganar +1 Comunion contra Avaricia o Envidia.',
  'Cancel World or reduce Desolation by 1.': 'Cancela Mundo o reduce Desolacion en 1.',
  'Look at the next 2 Dark Banner cards.': 'Mira las proximas 2 cartas de Bandera Oscura.',
  'If you failed the previous round, gain +3 Light and you may play one extra card.':
    'Si fallaste la ronda anterior, gana +3 Luz y puedes jugar una carta extra.',
  'Sin: Pride / Wrath. Darkness 8. Shortcut: Answer with irony: +5 Light, +1 Attachment. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Soberbia / Ira. Oscuridad 8. Atajo: responde con ironia: +5 Luz, +1 Apego. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Envy. Darkness 7. Shortcut: Minimize it: draw 1 and gain +3 Light, add Envy. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Envidia. Oscuridad 7. Atajo: minimizalo: roba 1 y gana +3 Luz, anade Envidia. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Greed. Darkness 6. Shortcut: Keep it for security: +1 Fruit, +1 Attachment. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Avaricia. Oscuridad 6. Atajo: guardalo por seguridad: +1 Fruto, +1 Apego. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Sloth. Darkness 5. Shortcut: Leave it for tomorrow: +1 Desolation. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Pereza. Oscuridad 5. Atajo: dejalo para manana: +1 Desolacion. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Pride / Wrath. Darkness 9. Shortcut: Justify yourself aggressively: +5 Light, +1 Attachment. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Soberbia / Ira. Oscuridad 9. Atajo: justificate agresivamente: +5 Luz, +1 Apego. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Lust. Darkness 8. Shortcut: Dwell on it: draw 2, +1 Attachment. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Lujuria. Oscuridad 8. Atajo: recrearte en ello: roba 2, +1 Apego. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Gluttony. Darkness 7. Shortcut: Anesthetize yourself: heal 1 Desolation, +1 Attachment. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Gula. Oscuridad 7. Atajo: anestesiate: sana 1 Desolacion, +1 Apego. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: World / Pride. Darkness 10. Shortcut: Look good: complete the Trial without Communion and add World. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Mundo / Soberbia. Oscuridad 10. Atajo: quedar bien: completa la Prueba sin Comunion y anade Mundo. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Pride. Darkness 7. Shortcut: Wait for the other to yield: +4 Light, +1 Attachment. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Soberbia. Oscuridad 7. Atajo: espera a que el otro ceda: +4 Luz, +1 Apego. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Sloth. Darkness 5. Shortcut: Postpone it: draw 1, +1 Desolation. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Pereza. Oscuridad 5. Atajo: posponlo: roba 1, +1 Desolacion. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Wrath. Darkness 8. Shortcut: Answer harshly: +5 Light, add Wrath. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Ira. Oscuridad 8. Atajo: responde con dureza: +5 Luz, anade Ira. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Pride / Envy. Darkness 7. Shortcut: Feel superior: +3 Light, +1 Attachment. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Soberbia / Envidia. Oscuridad 7. Atajo: sientete superior: +3 Luz, +1 Apego. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: World / Sloth. Darkness 6. Shortcut: Avoid it because nobody will see: +1 Fruit, +1 Desolation. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Mundo / Pereza. Oscuridad 6. Atajo: evitalo porque nadie lo vera: +1 Fruto, +1 Desolacion. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: World. Darkness 5. Shortcut: Distract yourself: draw 2, discard 1. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Mundo. Oscuridad 5. Atajo: distraete: roba 2, descarta 1. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Devil / Confusion. Darkness 11. Shortcut: Choose what is comfortable: +4 Light, +1 Attachment. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Demonio / Confusion. Oscuridad 11. Atajo: elige lo comodo: +4 Luz, +1 Apego. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Wrath / Desolation. Darkness 9. Shortcut: Close yourself off: avoid consequence, +1 Desolation. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Ira / Desolacion. Oscuridad 9. Atajo: cierrate: evita la consecuencia, +1 Desolacion. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Devil / Pride. Darkness 8. Shortcut: Useful half-truth: +5 Light, add Devil. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Demonio / Soberbia. Oscuridad 8. Atajo: media verdad util: +5 Luz, anade Demonio. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Flesh / Gluttony. Darkness 6. Shortcut: Yield without measure: +3 Light, +1 Attachment. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Carne / Gula. Oscuridad 6. Atajo: cede sin medida: +3 Luz, +1 Apego. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Desolation / Sloth. Darkness 7. Shortcut: Abandon it: draw 1, +1 Desolation. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Desolacion / Pereza. Oscuridad 7. Atajo: abandonalo: roba 1, +1 Desolacion. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Envy. Darkness 6. Shortcut: Congratulate externally, resent internally: +4 Light, +1 Attachment. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Envidia. Oscuridad 6. Atajo: felicita por fuera, resiente por dentro: +4 Luz, +1 Apego. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Greed / Devil. Darkness 10. Shortcut: Take advantage: +2 Fruits, +2 Attachment. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Avaricia / Demonio. Oscuridad 10. Atajo: aprovecha la situacion: +2 Frutos, +2 Apego. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Sloth / World. Darkness 8. Shortcut: Hide: avoid spending cards, +1 Desolation. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Pereza / Mundo. Oscuridad 8. Atajo: escondete: evita gastar cartas, +1 Desolacion. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: World / Envy. Darkness 7. Shortcut: Fantasize and despise the present: draw 2, +1 Attachment. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Mundo / Envidia. Oscuridad 7. Atajo: fantasea y desprecia el presente: roba 2, +1 Apego. Victoria limpia: +1 Comunion, +3 Frutos.',
  'Sin: Final. Darkness 10. Shortcut: Add +2 Darkness for each Attachment above 5. Clean victory: +1 Communion, +3 Fruits.':
    'Pecado: Final. Oscuridad 10. Atajo: anade +2 Oscuridad por cada Apego por encima de 5. Victoria limpia: +1 Comunion, +3 Frutos.',
};

const dictionary: Array<[RegExp, string]> = [
  [/\bYou cannot resolve before playing\./g, 'No puedes resolver antes de jugar.'],
  [/\bCannot reveal a Trial during phase ([^.]+)\./g, 'No se puede revelar una Prueba durante la fase $1.'],
  [/\bNo more Trials available\./g, 'No quedan Pruebas disponibles.'],
  [/\bReveal a Trial before choosing a banner\./g, 'Revela una Prueba antes de elegir una bandera.'],
  [/\bChose Christ's Banner\./g, 'Elegiste la Bandera de Cristo.'],
  [/\bAccepted the shortcut\./g, 'Aceptaste el atajo.'],
  [/\bChoose a banner before playing cards\./g, 'Elige una bandera antes de jugar cartas.'],
  [/\bCannot play more than (\d+) cards\./g, 'No puedes jugar mas de $1 cartas.'],
  [/\b(.+) shuffled the discard into a new deck\./g, '$1 barajo los descartes para formar un nuevo mazo.'],
  [/\b(.+) drew (.+)\./g, '$1 robo $2.'],
  [/\b(.+) played (.+)\./g, '$1 jugo $2.'],
  [/\bReturned (.+) to hand\./g, 'Devolviste $1 a la mano.'],
  [/\bCards can only be bought during the shop phase\./g, 'Las cartas solo se pueden comprar durante la fase de tienda.'],
  [/\bNot enough Fruits to buy (.+)\./g, 'No hay Frutos suficientes para comprar $1.'],
  [/\bBought (.+) for (\d+) Fruits\./g, 'Compraste $1 por $2 Frutos.'],
  [/\bYou are not in the shop phase\./g, 'No estas en la fase de tienda.'],
  [/\bShop phase ended\. Ready for the next Trial\./g, 'La fase de tienda termino. Listo para la siguiente Prueba.'],
  [/\bChoose Christ's Banner or Accept Shortcut before continuing\./g, 'Elige la Bandera de Cristo o Aceptar atajo antes de continuar.'],
  [/\bRules imported from JSON file\./g, 'Reglas importadas desde archivo JSON.'],
  [/\bCould not import rules: invalid JSON file\./g, 'No se pudieron importar las reglas: archivo JSON no valido.'],
  [/\bGame started in (.+) mode with (.+) difficulty\./g, 'Partida iniciada en modo $1 con dificultad $2.'],
  [/\bRound (\d+):/g, 'Ronda $1:'],
  [/\bIf you play a Gift after Prayer, add \+1 Fervor manually\./g, 'Si juegas un Don despues de Oracion, anade +1 Fervor manualmente.'],
  [/\b(.+) directly answers (.+)\. Consider adding \+4 Light manually before resolving\./g, '$1 responde directamente a $2. Considera anadir +4 Luz manualmente antes de resolver.'],
  [/\bUnfinished Journey\b/g, 'Camino inconcluso'],
  [/\bOne in God\b/g, 'Uno en Dios'],
  [/\bSober Victory\b/g, 'Victoria sobria'],
  [/\bDispersion\b/g, 'Dispersion'],
  [/\bPlayer (\d+)\b/g, 'Jugador $1'],
  [/\bpride\b/g, 'soberbia'],
  [/\bgreed\b/g, 'avaricia'],
  [/\blust\b/g, 'lujuria'],
  [/\bwrath\b/g, 'ira'],
  [/\bgluttony\b/g, 'gula'],
  [/\benvy\b/g, 'envidia'],
  [/\bsloth\b/g, 'pereza'],
  [/\beasy\b/g, 'contemplativo'],
  [/\bnormal\b/g, 'normal'],
  [/\bhard\b/g, 'combate intenso'],
  [/\bsolo\b/g, 'solitario'],
  [/\bcoop\b/g, 'cooperativo local'],
  [/\bsetup\b/g, 'configuracion'],
  [/\bready\b/g, 'lista'],
  [/\bchoose-banner\b/g, 'elegir bandera'],
  [/\bplay\b/g, 'jugar'],
  [/\bshop\b/g, 'tienda'],
  [/\bended\b/g, 'terminada'],
  [/\bbonusLight\b/g, 'Luz adicional'],
  [/\bbonusFervor\b/g, 'Fervor adicional'],
  [/\bdarknessModifier\b/g, 'Modificador de Oscuridad'],
  [/\bcommunion\b/g, 'Comunion'],
  [/\battachment\b/g, 'Apego'],
  [/\bdesolation\b/g, 'Desolacion'],
  [/\bconsolation\b/g, 'Consolacion'],
  [/\bfruits\b/g, 'Frutos'],
];

const accentFixes: Array<[RegExp, string]> = [
  [/\bComunion\b/g, 'Comunión'],
  [/\bDesolacion\b/g, 'Desolación'],
  [/\bConsolacion\b/g, 'Consolación'],
  [/\bOracion\b/g, 'Oración'],
  [/\bAtencion\b/g, 'Atención'],
  [/\bEspiritu\b/g, 'Espíritu'],
  [/\bPractica\b/g, 'Práctica'],
  [/\bTentacion\b/g, 'Tentación'],
  [/\bEleccion\b/g, 'Elección'],
  [/\bSabiduria\b/g, 'Sabiduría'],
  [/\bSenor\b/g, 'Señor'],
  [/\bConfirmacion\b/g, 'Confirmación'],
  [/\bEucaristia\b/g, 'Eucaristía'],
  [/\bReconciliacion\b/g, 'Reconciliación'],
  [/\bUncion\b/g, 'Unción'],
  [/\bSantisima\b/g, 'Santísima'],
  [/\bAngel\b/g, 'Ángel'],
  [/\bArcangel\b/g, 'Arcángel'],
  [/\bJesus\b/g, 'Jesús'],
  [/\bAsis\b/g, 'Asís'],
  [/\bJose\b/g, 'José'],
  [/\bCatolica\b/g, 'Católica'],
  [/\bMaria\b/g, 'María'],
  [/\bquerias\b/g, 'querías'],
  [/\bEstas\b/g, 'Estás'],
  [/\bhumillacion\b/g, 'humillación'],
  [/\bvacio\b/g, 'vacío'],
  [/\bperdon\b/g, 'perdón'],
  [/\bpequena\b/g, 'pequeña'],
  [/\bconversacion\b/g, 'conversación'],
  [/\bdecision\b/g, 'decisión'],
  [/\bproxima\b/g, 'próxima'],
  [/\bproximas\b/g, 'próximas'],
  [/\bpurificacion\b/g, 'purificación'],
  [/\bcompanero\b/g, 'compañero'],
  [/\banade\b/g, 'añade'],
  [/\bexito\b/g, 'éxito'],
  [/\bpenalizacion\b/g, 'penalización'],
  [/\bconfusion\b/g, 'confusión'],
  [/\bacompanamiento\b/g, 'acompañamiento'],
  [/\bmanana\b/g, 'mañana'],
  [/\bmas\b/g, 'más'],
  [/\bvalido\b/g, 'válido'],
  [/\brobo\b/g, 'robó'],
  [/\bjugo\b/g, 'jugó'],
  [/\bbarajo\b/g, 'barajó'],
  [/\btermino\b/g, 'terminó'],
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const exactEntries = Object.entries({ ...textTranslations, ...exactTranslations }).sort(
  (a, b) => b[0].length - a[0].length,
);

function translateText(value: string): string {
  if (textTranslations[value]) return applyAccentFixes(textTranslations[value]);
  if (exactTranslations[value]) return applyAccentFixes(exactTranslations[value]);

  const withExactPhrases = exactEntries.reduce(
    (text, [source, replacement]) => text.replace(new RegExp(escapeRegExp(source), 'g'), replacement),
    value,
  );

  return applyAccentFixes(
    dictionary.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), withExactPhrases),
  );
}

function applyAccentFixes(value: string): string {
  return accentFixes.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

export function localizeText(value: string, lang: Language): string {
  return lang === 'es' ? translateText(value) : value;
}

export function localizeCard(card: Card, lang: Language): Card {
  if (lang === 'en') return card;
  return {
    ...card,
    name: translateText(card.name),
    subtype: translateText(card.subtype),
    text: translateText(card.text),
    tags: card.tags.map((tag) => translateText(tag)),
  };
}
