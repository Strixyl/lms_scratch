// ── Sentiment Dashboard — Domain Constants ──────────────────────────────────
// All static domain data: lexicons, recommendations, scales, dropdown options.

// ── Dropdown Options ────────────────────────────────────────────────────────
export const CLIENTELE_OPTIONS = ['Student', 'Faculty', 'Staff', 'Researcher', 'CPU Admin', 'Alumnus/Alumni'];

export const COLLEGE_OPTIONS = [
  'CARES', 'CAS', 'CBA', 'CCS', 'COED', 'COE', 'CHM',
  'COL', 'CMLS', 'COM', 'CON', 'COP', 'COT', 'SGS',
  'SHS', 'JHS', 'ELEM', 'KINDER'
];

export const CATEGORY_OPTIONS = ['Facilities', 'Staff', 'Collection', 'Other/Uncategorized'];

// ── Rating Scores & Satisfaction Scale ───────────────────────────────────────
export const RATING_SCORES = {
  very_satisfied: 1.0, satisfied: 0.5, neutral: 0.0,
  dissatisfied: -0.5, very_dissatisfied: -1.0, na: 0.0,
};

export const SATISFACTION_SCALE = {
  very_satisfied: 5, satisfied: 4, neutral: 3,
  dissatisfied: 2, very_dissatisfied: 1, na: null,
};

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ROWS_PER_PAGE = 8;

// ── Stopwords (filtered from word cloud) ────────────────────────────────────
export const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on',
  'for', 'it', 'this', 'that', 'i', 'we', 'you', 'my', 'our', 'with', 'be', 'have', 'has',
  'very', 'so', 'too', 'library', 'cpu', 'student', 'students', 'just', 'also', 'can', 'will',
  'more', 'get', 'make', 'please', 'really', 'there', 'they', 'their', 'them', 'from', 'all',
  'would', 'could', 'should', 'about', 'out', 'up', 'been', 'when', 'what', 'which', 'than',
  // Quantifiers, degree words & generic English fillers (prevents terms like "lot" or "quality" from overriding subject nouns)
  'lot', 'lots', 'many', 'much', 'few', 'some', 'several', 'every', 'each', 'huge', 'lack',
  'bad', 'good', 'nice', 'great', 'better', 'best', 'worst', 'poor', 'quality', 'high', 'low',
  'one', 'two', 'new', 'old', 'big', 'small', 'thing', 'things', 'way', 'ways', 'kind', 'kinds'
]);

// ── Controlled Domain Lexicon ───────────────────────────────────────────────
export const CONTROLLED_LEXICON = {
  Facilities: {
    'Restroom & Hygiene': [
      'restroom', 'restrooms', 'comfort room', 'comfort rooms', 'cr', 'toilet', 'toilets',
      'washroom', 'washrooms', 'lavatory', 'dirty restroom', 'smelly restroom',
      'unclean', 'foul odor', 'soap', 'tissue', 'tissues', 'paper towel', 'paper towels',
      'water', 'faucet', 'faucets', 'flush', 'sink', 'sinks', 'bidet'
    ],
    'Air Conditioning': [
      'aircon', 'air condition', 'air conditioning', 'ac unit', 'air-con', 'temperature',
      'too hot', 'too warm', 'too cold', 'freezing', 'cold temperature', 'hot temperature',
      'cooling', 'electric fan', 'humid', 'ventilation', 'climate control', 'stuffy'
    ],
    'Tables, Seating & Space': [
      'table', 'tables', 'chair', 'chairs', 'seat', 'seats', 'seating', 'bench', 'benches',
      'desk', 'desks', 'space', 'crowded', 'full', 'overcrowded', 'cubicle', 'cubicles',
      'study hall', 'carrel', 'carrels', 'study area', 'reading area'
    ],
    'Wi-Fi & Power Outlets': [
      'wifi', 'wi-fi', 'internet', 'connection', 'wi-fi connection', 'wifi connection',
      'network', 'signal', 'disconnecting', 'disconnected', 'slow internet', 'fast internet',
      'no internet', 'outlet', 'outlets', 'power outlet', 'power outlets', 'plug', 'plugs',
      'socket', 'sockets', 'charging', 'extension cord'
    ],
    'Noise Level & Ambience': [
      'noise', 'noisy', 'loud', 'quiet', 'silent', 'talking', 'chitchat', 'whispering',
      'distracting', 'distraction', 'peaceful', 'concentration', 'study zone', 'chaotic'
    ],
    'Lighting & Cleanliness': [
      'lighting', 'dim light', 'dark', 'dim', 'bright', 'clean', 'cleanliness',
      'dust', 'dusty', 'trash', 'garbage', 'litter', 'maintenance', 'smell', 'odor'
    ],
    'Equipments': [
      'equipment', 'equipments', 'scanner', 'scanners', 'barcode scanner', 'barcode',
      'computer', 'computers', 'desktop', 'computer lab', 'mouse',
      'keyboard', 'monitor', 'screen', 'printer', 'printing', 'printer machine',
      'photocopy', 'photocopier', 'scanning', 'cyber library', 'cyberlib'
    ]
  },
  Staff: {
    'Librarians & Staffs': [
      'librarian', 'librarians', 'staff', 'staffs', 'library staff', 'assistant', 'assistants',
      'student assistant', 'student assistants', 'desk staff', 'counter staff', 'personnel',
      'circulation counter', 'reference counter', 'staff in charge', 'front desk'
    ],
    'Security': [
      'guard', 'guards', 'security', 'security guard', 'security guards', 'entrance guard',
      'bag check', 'bag deposit', 'sign in', 'entrance lobby', 'lobby guard'
    ],
    'Service Quality & Attitude': [
      'attitude', 'polite', 'impolite', 'rude', 'helpful', 'unhelpful', 'not helpful',
      'approachable', 'unapproachable', 'accommodating', 'unaccommodating', 'kind',
      'unkind', 'attentive', 'inattentive', 'ignoring', 'slow service', 'fast service',
      'snobbish', 'friendly', 'unfriendly', 'courteous', 'discourteous', 'assisted',
      'assistance', 'annoyed'
    ]
  },
  Collection: {
    'Digital Resources & E-Books': [
      'e-book', 'ebook', 'e-books', 'ebooks', 'e-journal', 'e-journals', 'ejournal', 'ejournals',
      'digital repository', 'repository', 'online database', 'database', 'databases',
      'digital library', 'online journal', 'online journals', 'e-resource', 'e-resources',
      'electronic resource', 'electronic resources'
    ],
    'Books & Reference Materials': [
      'book', 'books', 'reference material', 'reference materials', 'reference book',
      'reference books', 'textbook', 'textbooks', 'journal', 'journals', 'reading material',
      'reading materials', 'thesis', 'manuscript', 'manuscripts', 'periodical', 'periodicals',
      'magazine', 'magazines', 'dictionary', 'encyclopedia', 'book collections', 'collection',
      'outdated', 'old books', 'updated books', 'edition'
    ],
    'Catalogue, OPAC & Search': [
      'catalogue', 'catalog', 'opac', 'online catalog', 'card catalog', 'search system',
      'index', 'accession number', 'call number', 'location', 'shelf', 'shelving', 'book shelf'
    ],
    'Borrowing & Circulation': [
      'borrow', 'borrowing', 'return', 'returning', 'due date', 'fine', 'fines', 'overdue',
      'penalty', 'renewal', 'renew', 'library card', 'checkout', 'check out', 'circulation',
      'stamp card', 'stamp my card', 'stamping'
    ]
  }
};

// ── Service Improvement Recommendations ─────────────────────────────────────
export const RECOMMENDATIONS = {
  Facilities: {
    moderate: 'Consider a facilities walkthrough to address recurring comfort/accessibility complaints (lighting, seating, temperature, cleanliness).',
    high: 'Facilities feedback is predominantly negative; prioritize an infrastructure audit and budget request for repairs/upgrades this term.',
  },
  Staff: {
    moderate: 'Some patrons report friction with staff interactions, a refresher on frontline service standards may help.',
    high: 'Staff-related complaints are high, recommend a service-quality review with librarians and staffs.',
  },
  Collection: {
    moderate: 'Patrons are flagging gaps in available materials; review acquisition requests for undersupplied subject areas.',
    high: 'Collection dissatisfaction is high, conduct a collection audit and prioritize acquisitions for the most-requested topics and subjects.',
  },
};

// ── Category Keywords for Analytics ─────────────────────────────────────────
export const CATEGORY_KEYWORDS = {
  Facilities: {
    aircon: 'poor air conditioning/temperature control',
    ac: 'air conditioning issues',
    temperature: 'temperature control issues',
    temp: 'temperature issues',
    lighting: 'insufficient lighting',
    light: 'lighting issues',
    wifi: 'unreliable wifi/internet connection',
    internet: 'unreliable internet connection',
    seating: 'insufficient or uncomfortable seating',
    seat: 'seating issues',
    chair: 'uncomfortable seating/chairs',
    table: 'workspace/table issues',
    cleanliness: 'cleanliness/sanitation concerns',
    clean: 'cleanliness concerns',
    restroom: 'restroom cleanliness/maintenance',
    toilet: 'restroom issues',
    noise: 'high noise levels affecting study',
    loud: 'noise levels',
  },
  Staff: {
    rude: 'patron friction with staff courtesy/attitude',
    slow: 'slow service response times',
    unhelpful: 'unhelpful staff assistance',
    attitude: 'staff attitude concerns',
    service: 'frontline service quality',
    retraining: 'staff retraining needs',
  },
  Collection: {
    outdated: 'outdated books/materials',
    old: 'outdated materials',
    missing: 'missing or unlocatable books',
    textbook: 'insufficient textbook copies',
    book: 'missing/unavailable books',
    journal: 'lack of recent research journals/e-resources',
    database: 'digital database access issues',
  },
};
