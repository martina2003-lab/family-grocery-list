const CATEGORIE = [
  { id: 'frutta',     nome: 'Frutta & Verdura',   emoji: '🥦', colore: '#34d399' },
  { id: 'carne',      nome: 'Carne',               emoji: '🥩', colore: '#f87171' },
  { id: 'pesce',      nome: 'Pesce',               emoji: '🐟', colore: '#22d3ee' },
  { id: 'latticini',  nome: 'Latticini',           emoji: '🧀', colore: '#60a5fa' },
  { id: 'pane',       nome: 'Pane',                emoji: '🍞', colore: '#fbbf24' },
  { id: 'pasta',      nome: 'Pasta & Riso',        emoji: '🍝', colore: '#fdba74' },
  { id: 'bevande',    nome: 'Bevande',             emoji: '🧃', colore: '#38bdf8' },
  { id: 'surgelati',  nome: 'Surgelati',           emoji: '🧊', colore: '#a5f3fc' },
  { id: 'gelati',     nome: 'Gelati',              emoji: '🍦', colore: '#f9a8d4' },
  { id: 'caramelle',  nome: 'Caramelle & Snack',   emoji: '🍬', colore: '#fb7185' },
  { id: 'salse',      nome: 'Salse',               emoji: '🫙', colore: '#fb923c' },
  { id: 'sughi',      nome: 'Sughi',               emoji: '🍅', colore: '#ef4444' },
  { id: 'pulizia',    nome: 'Pulizia Casa',        emoji: '🧹', colore: '#a78bfa' },
  { id: 'igiene',     nome: 'Igiene',              emoji: '🧴', colore: '#f472b6' },
  { id: 'farmacia',   nome: 'Farmacia',            emoji: '💊', colore: '#4ade80' },
  { id: 'condimenti', nome: 'Condimenti & Spezie', emoji: '🌶️', colore: '#fde68a' },
  { id: 'animali',    nome: 'Animali',             emoji: '🐾', colore: '#c4b5fd' },
  { id: 'altro',      nome: 'Altro',               emoji: '🛒', colore: '#94a3b8' },
];

// Oggetto usato per prodotti non riconosciuti
const NESSUNA_CATEGORIA = { id: null, nome: 'Senza categoria', emoji: '·', colore: '#475569' };

const DIZIONARIO = {
  frutta: [
    'mela','mele','pera','pere','banana','banane','arancia','arance','limone','limoni',
    'lime','fragola','fragole','uva','kiwi','mango','ananas','melone','anguria',
    'pesca','pesche','albicocca','albicocche','prugna','prugne','ciliegia','ciliegie',
    'mandarino','mandarini','clementina','clementine','pompelmo','avocado',
    'lampone','lamponi','mirtillo','mirtilli','melograno','fico','fichi',
    'dattero','datteri','cocco','papaya','maracuja','litchi','nespola','cachi',
    'insalata','lattuga','rucola','spinaci','pomodoro','pomodori','ciliegino',
    'cetriolo','cetrioli','peperone','peperoni','zucchina','zucchine',
    'melanzana','melanzane','carota','carote','sedano','finocchio',
    'broccolo','broccoli','cavolfiore','cavolo','cavolo cappuccio','cavolo nero',
    'cipolla','cipolle','cipollotto','aglio','scalogno',
    'patata','patate','zucca','funghi','porcini','champignon','shiitake',
    'asparagi','carciofi','radicchio','piselli','fagiolini','fave',
    'ceci','lenticchie','mais','topinambur','barbabietola','rapa','rapanello',
    'bietola','porro','prezzemolo fresco','basilico fresco','menta fresca',
  ],
  carne: [
    'pollo','petto di pollo','cosce di pollo','ali di pollo','tacchino','fesa di tacchino',
    'manzo','maiale','vitello','agnello','coniglio','anatra','faraona',
    'salsiccia','salsicce','würstel','wurstel','bratwurst',
    'bresaola','prosciutto cotto','prosciutto crudo','salame','mortadella',
    'speck','pancetta','guanciale','coppa','lonza','lardo','nduja',
    'cotoletta','fettine','bistecca','hamburger','polpette','arrosto',
    'costine','petto','stinco','ossobuco','trippa','fegato','cuore',
    'carpaccio','tartare','roast beef','würstel di pollo',
  ],
  pesce: [
    'salmone','tonno','merluzzo','branzino','orata','spigola',
    'acciughe','sardine','sgombro','aringa','alici',
    'gamberi','mazzancolle','scampi','gamberetti','gamberoni',
    'vongole','cozze','calamari','polpo','seppie','totani',
    'sogliola','halibut','trota','baccalà','pesce spada','dentice',
    'rombo','rana pescatrice','cernia','ricciola','palamita',
    'aragosta','granchio','astice','granciporro','bottarga',
    'tonno in scatola','salmone affumicato','sgombro in scatola',
  ],
  latticini: [
    'latte','latte intero','latte parzialmente scremato','latte scremato',
    'latte di mandorla','latte di soia','latte di avena','latte di riso',
    'latte condensato','latte in polvere',
    'yogurt','yogurt greco','yogurt bianco','yogurt alla frutta','kefir',
    'burro','panna','panna da cucina','panna fresca','panna montata',
    'mozzarella','burrata','mozzarella di bufala','fior di latte',
    'parmigiano','parmigiano reggiano','pecorino','grana','grana padano',
    'gorgonzola','ricotta','brie','camembert','emmental','asiago',
    'provola','scamorza','fontina','philadelphia','stracchino','crescenza',
    'mascarpone','fiocchi di latte','robiola','taleggio','groviera',
    'uova','uova di gallina','uova biologiche',
  ],
  pane: [
    'pane','pane integrale','pane in cassetta','pan carré','pane di segale',
    'pane multicereali','pane senza glutine','pane ai cereali',
    'panini','rosette','ciabatta','baguette','michette','grissini',
    'crackers','crackers integrali','fette biscottate','fette biscottate integrali',
    'focaccia','pizzette','pizzette rosse','brioche','cornetto','croissant',
    'pan brioche','taralli','freselle','piadina','tortilla',
    'muffin','plumcake','torta','crostata','pasta sfoglia','pasta frolla',
    'biscotti','biscotti al burro','biscotti integrali','cantucci','amaretti',
    'farina','farina 00','farina integrale','farina di mais','farina di riso',
    'farina di mandorle','farina di ceci','farina senza glutine',
    'lievito','lievito di birra','lievito in polvere','bicarbonato',
    'zucchero','zucchero a velo','zucchero di canna','zucchero semolato',
    'cacao','cioccolato','cioccolato fondente','cioccolato al latte',
    'nutella','marmellata','confettura','miele','sciroppo',
  ],
  pasta: [
    'pasta','spaghetti','spaghettini','spaghetti integrali','rigatoni','penne',
    'penne rigate','fusilli','farfalle','linguine','tagliatelle','lasagne',
    'gnocchi','tortellini','ravioli','orecchiette','bucatini','mezze penne',
    'tortiglioni','conchiglie','paccheri','vermicelli','capellini','fettuccine',
    'maltagliati','trofie','strozzapreti','caserecce','lumache','mezze maniche',
    'pasta all\'uovo','pasta integrale','pasta senza glutine','pasta di legumi',
    'pasta di farro','pasta di riso','pasta di mais',
    'riso','riso carnaroli','riso arborio','riso basmati','riso integrale',
    'riso venere','riso parboiled','riso vialone nano',
    'risotto','orzo','farro','cous cous','bulgur','quinoa','polenta',
    'miglio','grano saraceno','avena',
  ],
  bevande: [
    'acqua','acqua naturale','acqua frizzante','acqua tonica','acqua aromatizzata',
    'coca cola','coca cola zero','fanta','sprite','pepsi','aranciata',
    'limonata','chinotto','gassosa','ginger ale',
    'succo','succo di frutta','succo d\'arancia','succo di mela','nettare',
    'smoothie','centrifugato',
    'tè','tè freddo','tè verde','tè nero','tè alla pesca','tè al limone',
    'caffè','caffè in polvere','caffè in capsule','caffè solubile',
    'orzo','camomilla','tisana','infuso','matcha',
    'birra','birra artigianale','birra analcolica','birra scura','birra chiara',
    'vino','vino rosso','vino bianco','vino rosato','prosecco','spumante',
    'champagne','lambrusco',
    'amaro','aperitivo','aperol','campari','martini',
    'rum','vodka','gin','whisky','grappa','limoncello',
    'energy drink','kombucha',
  ],
  surgelati: [
    'surgelati','piselli surgelati','spinaci surgelati','verdure surgelate',
    'patate surgelate','patatine surgelate','bastoncini di pesce',
    'cotolette surgelate','lasagne surgelate','pizza surgelata',
    'minestrone surgelato','gamberetti surgelati','calamari surgelati',
    'soupe surgelata','frutta surgelata','frutti di bosco surgelati',
    'mais surgelato','edamame surgelati','fagiolini surgelati',
    'broccoli surgelati','funghi surgelati','zucchine surgelate',
    'cornetti surgelati','croissant surgelati','burger surgelato',
    'pollo surgelato','wurstel surgelati',
  ],
  gelati: [
    'gelato','gelati','ghiacciolo','ghiaccioli','cono gelato','coppa gelato',
    'gelato alla crema','gelato al cioccolato','gelato alla fragola',
    'gelato alla vaniglia','gelato al pistacchio','gelato al limone',
    'gelato alla nocciola','gelato stracciatella',
    'gelato kinder bueno','kinder bueno gelato','gelato nutella',
    'magnum','cornetto algida','calippo','stecco','sandwich gelato',
    'fiordilatte gelato','semifreddo','torta gelato',
  ],
  caramelle: [
    'caramelle','caramella','gomme','chewing gum','mentine','tic tac',
    'cioccolatini','kinder','kinder bueno','kinder sorpresa','kinder delice',
    'ferrero rocher','raffaello','bounty','snickers','twix','kit kat',
    'oreo','ringo','wafer','nutella biscuits','pan di stelle',
    'chips','patatine','pop corn','nachos','popcorn',
    'noccioline','arachidi','pistacchi','mandorle','anacardi',
    'merendine','snack','barretta','barrette energetiche','granola bar',
    'cereali','corn flakes','müesli','granola','fiocchi d\'avena',
    'riso soffiato',
  ],
  salse: [
    'maionese','ketchup','senape','senape di digione',
    'salsa worcester','tabasco','sriracha','harissa',
    'salsa di soia','salsa tamari','salsa teriyaki','salsa agrodolce',
    'salsa tartara','aioli','salsa rosa','salsa cocktail',
    'pesto','pesto alla genovese','pesto rosso','pesto di rucola',
    'hummus','guacamole','tzatziki','baba ganoush',
    'salsa barbecue','ranch','salsa buffalo','salsa al curry',
    'salsa verde','chimichurri','salsa tonnata',
  ],
  sughi: [
    'sugo','sugo al pomodoro','sugo al ragù','ragù','sugo alla bolognese',
    'sugo all\'amatriciana','sugo alla norma','sugo alle verdure',
    'sugo al pesto','sugo all\'arrabbiata',
    'sugo alle vongole','sugo ai funghi','sugo al tartufo',
    'passata','passata di pomodoro','pomodori pelati','polpa di pomodoro',
    'concentrato di pomodoro','doppio concentrato',
    'salsa pronta','sugo pronto',
  ],
  pulizia: [
    'detersivo','detersivo piatti','detersivo lavatrice','detersivo lavastoviglie',
    'pastiglie lavastoviglie','brillantante lavastoviglie','sale lavastoviglie',
    'ammorbidente','candeggina','anticalcare','sgrassatore','detergente multiuso',
    'detergente bagno','detergente wc','detergente pavimenti','detergente vetri',
    'alcol','alcol etilico','alcol isopropilico',
    'sacchetti spazzatura','sacchetti immondizia','buste differenziata',
    'carta igienica','fazzoletti','salviette','rotolo cucina','carta assorbente',
    'spugna','spugne','pagliette','scotch brite',
    'scopa','mocio','strofinaccio','panno microfibra','guanti pulizia','palette',
    'scopino bagno',
  ],
  igiene: [
    'shampoo','balsamo','maschera capelli','olio capelli',
    'bagnoschiuma','docciaschiuma','sapone','saponetta','sapone liquido',
    'dentifricio','spazzolino','filo interdentale','collutorio',
    'rasoi','rasoi usa e getta','schiuma da barba','gel da barba','dopobarba',
    'deodorante','deodorante spray','deodorante roll on',
    'crema corpo','crema viso','crema mani','crema piedi','siero viso',
    'protezione solare','doposole','struccante','acqua micellare',
    'cotone','dischetti struccanti',
    'tamponi','assorbenti','assorbenti interni','salvaslip',
    'preservativi','pannolini','pannolini pull-up',
    'salviettine umide','salviettine neonato','crema cambio pannolino',
  ],
  farmacia: [
    'aspirina','tachipirina','brufen','ibuprofene','paracetamolo','efferalgan',
    'antidolorifico','antinfiammatorio','antibiotico',
    'antistaminico','antiacido',
    'cerotti','bende','garze','garze sterili','cerotto',
    'disinfettante','betadine','amuchina','acqua ossigenata',
    'collirio','gocce nasali','spray nasale','spray gola','sciroppo',
    'vitamina c','vitamina d','vitamina b12','multivitaminico',
    'integratore','magnesio','zinco','ferro','omega 3','probiotici',
    'melatonina','oki','moment','nurofen','voltaren','arnica',
    'lassativo','antidiarroico','carbone attivo',
    'test covid','termometro',
  ],
  condimenti: [
    'olio','olio di oliva','olio extravergine','olio evo','olio di semi',
    'olio di girasole','olio di arachidi','olio di mais','olio di cocco',
    'aceto','aceto balsamico','aceto di vino rosso','aceto di vino bianco','aceto di mele',
    'sale','sale fino','sale grosso','sale iodato','sale rosa',
    'pepe','pepe nero','pepe bianco','pepe rosa','peperoncino',
    'paprika dolce','paprika affumicata','origano','basilico','rosmarino',
    'timo','salvia','prezzemolo','alloro',
    'noce moscata','curcuma','curry','cannella','zafferano','cumino',
    'cardamomo','chiodi di garofano','anice','semi di sesamo',
    'semi di chia','semi di zucca','semi di girasole','semi di lino',
    'dado','dado vegetale','dado di pollo','dado di manzo',
    'brodo','brodo di pollo','brodo vegetale','brodo di pesce',
    'capperi','olive','olive nere','olive verdi','tahin','pasta di sesamo',
    'lievito alimentare','amido di mais','maizena',
  ],
  animali: [
    'crocchette','crocchette cane','crocchette gatto','cibo per cane','cibo per gatto',
    'cibo umido cane','cibo umido gatto','bustine gatto','bustine cane',
    'snack cane','snack gatto','dentastix','osso cane',
    'croccantini gatto','paté gatto',
    'lettiera','lettiera agglomerante','lettiera silicio',
    'shampoo cane','shampoo gatto','antiparassitario','pipette antiparassitarie',
    'collare antiparassitario','spray antiparassitario',
    'cibo per uccelli','cibo per pesci',
    'sabbia per cincillà','fieno per conigli','pellet per conigli',
  ],
};

function getCategoriaById(id) {
  if (!id) return NESSUNA_CATEGORIA;
  return CATEGORIE.find(c => c.id === id) || NESSUNA_CATEGORIA;
}

// Ritorna null se il prodotto non rientra in nessuna categoria.
// Priorità: 1) match esatto  2) il nome è prefisso di una parola (vince la parola più corta)
//           3) la parola è contenuta nel nome  4) il nome è contenuto nella parola
function riconosciCategoria(nome) {
  if (!nome || typeof nome !== 'string') return null;
  const q = nome.trim().toLowerCase();
  if (!q) return null;

  // 1. Match esatto
  for (const [catId, parole] of Object.entries(DIZIONARIO)) {
    if (parole.includes(q)) return catId;
  }

  // 2. q è prefisso di una parola del dizionario → prende la parola più corta (più specifica)
  let bestCat = null;
  let bestLen = Infinity;
  for (const [catId, parole] of Object.entries(DIZIONARIO)) {
    for (const p of parole) {
      if (p.startsWith(q) && p.length < bestLen) {
        bestLen = p.length;
        bestCat = catId;
      }
    }
  }
  if (bestCat) return bestCat;

  // 3. Una parola del dizionario è contenuta nel nome (es. "olio extravergine d'oliva" contiene "olio")
  for (const [catId, parole] of Object.entries(DIZIONARIO)) {
    if (parole.some(p => q.includes(p))) return catId;
  }

  // 4. Il nome è contenuto in una parola (fallback per query molto corte)
  for (const [catId, parole] of Object.entries(DIZIONARIO)) {
    if (parole.some(p => p.includes(q))) return catId;
  }

  return null;
}

// Ricerca predittiva: restituisce [{nome, categoria}] ordinati per rilevanza
function getProdottiSuggeriti(query, max = 8) {
  if (!query || query.length < 2) return [];
  const q = query.trim().toLowerCase();
  const startsWith = [];
  const contains = [];
  const visti = new Set();
  for (const [catId, parole] of Object.entries(DIZIONARIO)) {
    for (const p of parole) {
      if (visti.has(p)) continue;
      if (p.startsWith(q)) {
        visti.add(p);
        startsWith.push({ nome: p, categoria: catId });
      } else if (p.includes(q)) {
        visti.add(p);
        contains.push({ nome: p, categoria: catId });
      }
    }
  }
  return [...startsWith, ...contains].slice(0, max);
}
