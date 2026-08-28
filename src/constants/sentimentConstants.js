// ── Sentiment Dashboard — Domain Constants ──────────────────────────────────
// All static domain data: lexicons, recommendations, scales, dropdown options.

// ── Dropdown Options ────────────────────────────────────────────────────────
export const CLIENTELE_OPTIONS = ['Student', 'Faculty', 'Staff', 'Researcher', 'CPU Admin', 'Alumnus/Alumni'];

export const COLLEGE_OPTIONS = [
  'CARES', 'CAS', 'CBA', 'CCS', 'COED', 'COE', 'CHM',
  'COL', 'CMLS', 'COM', 'CON', 'COP', 'COT', 'SGS',
  'SHS', 'JHS', 'ELEM', 'KINDER'
];

export const cleanCollegeName = (collegeStr) => {
  if (!collegeStr) return 'N/A';
  let s = String(collegeStr).trim();
  // Fix typo error: Comouter Studies -> Computer Studies
  s = s.replace(/comouter/gi, 'Computer');
  return s || 'N/A';
};

export const COLLEGE_COURSES = {
  'Faculty / Staff': ['Faculty', 'Staff'],
  CARES: ['Agriculture', 'Agricultural and Biosystems Engineering', 'Environmental Management'],
  CAS: ['English Language Studies', 'Biology with specialization in Medical Biology', 'Biology with specialization in Microbiology', 'Chemistry', 'Psychology', 'Social Work'],
  CBA: ['Accountancy', 'Management Accounting', 'Business Administration major in Human Resource Management', 'Business Administration major in Financial Management', 'Business Administration major in Marketing Management', 'Entrepreneurship'],
  CCS: ['Computer Science', 'Digital Media and Interactive Arts', 'Information Technology', 'Library and Information Science'],
  COED: ['Early Childhood Education', 'Elementary Education', 'Physical Education', 'Secondary Education major in English', 'Secondary Education major in Filipino', 'Secondary Education major in Mathematics', 'Secondary Education major in Science', 'Secondary Education major in Special Needs Education'],
  COE: ['Chemical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics Engineering', 'Mechanical Engineering', 'Packaging Engineering', 'Software Engineering', 'Diploma in Packaging Technology'],
  CHM: ['Hospitality Management', 'Tourism Management'],
  CMLS: ['Medical Laboratory Science'],
  CON: ['Nursing'],
  COP: ['Pharmacy'],
  COL: ['Juris Doctor'],
  COM: ['Respiratory Therapy', 'Doctor of Medicine'],
  COT: ['Theology', 'Certificate in Christian Ministry', 'Diploma in Christian Ministry'],
  SGS: [
    'Doctor of Education major in Curriculum and Instruction',
    'Doctor of Education major in Educational Administration and Supervision',
    'Doctor of Education major in Guidance and Counseling',
    'Doctor of Management major in Business Management',
    'Doctor of Management major in Public Management',
    'Doctor of Management major in Development Management',
    'Doctor of Management major in Tourism and Hospitality Management',
    'Doctor of Ministry major in Pastoral Counseling & Pastoral Supervision',
    'Doctor of Ministry major in Church Management and Practical Ministries',
    'Master of Divinity',
    'Master of Theology',
    'Master of Ministry',
    'Master of Arts in Pastoral Counseling',
    'Master of Arts in Education major in Educational Administration and Supervision',
    'Master of Arts in Education major in Guidance and Counseling',
    'Master of Arts in Education major in Mathematics',
    'Master of Arts in Education major in Filipino',
    'Master of Arts in Education major in English Language and Literature',
    'Master of Science in Agriculture',
    'Master in Business Administration with Thesis',
    'Master in Business Administration major in Tourism and Hospitality Management',
    'Master of Arts in Nursing major in Nursing Service Administration',
    'Master of Arts in Nursing major in Adult Health Nursing',
    'Master of Arts in Nursing major in Women and Child Health Nursing',
    'Master in Public Administration',
    'Master of Science in Guidance and Counseling',
    'Master of Science in Teaching Biology'
  ],
  SHS: ['ABM', 'HUMSS', 'STEM'],
  JHS: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
  ELEM: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  KINDER: ['Kinder', 'Pre Kinder', 'Junior Kinder']
};

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

export const QUARTER_OPTIONS = [
  { value: 'Q1', label: 'Q1 (Jan–Mar)' },
  { value: 'Q2', label: 'Q2 (Apr–Jun)' },
  { value: 'Q3', label: 'Q3 (Jul–Sep)' },
  { value: 'Q4', label: 'Q4 (Oct–Dec)' },
];

export const ROWS_PER_PAGE = 10;

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
    'Hours & Operating Schedule': [
      'hours', 'operating hours', 'open hours', 'schedule', 'extended hours', 'closing time',
      'opening time', 'finals week', 'finals'
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
    Aircon: 'Poor air conditioning/temperature control',
    AC: 'Air conditioning issues',
    Temperature: 'Temperature control issues',
    Temp: 'Temperature issues',
    Lighting: 'Insufficient lighting',
    Light: 'Lighting issues',
    Wifi: 'Unreliable wifi/internet connection',
    Internet: 'Unreliable internet connection',
    Seating: 'Insufficient or uncomfortable seating',
    Seat: 'Seating issues',
    Chair: 'Uncomfortable seating/chairs',
    Table: 'Workspace/table issues',
    Cleanliness: 'Cleanliness/sanitation concerns',
    Clean: 'Cleanliness concerns',
    Restroom: 'Restroom cleanliness/maintenance',
    Toilet: 'Restroom issues',
    Noise: 'High noise levels affecting study',
    Loud: 'Noise levels',
  },
  Staff: {
    Rude: 'Patron friction with staff courtesy/attitude',
    Slow: 'Slow service response times',
    Unhelpful: 'Unhelpful staff assistance',
    Attitude: 'Staff attitude concerns',
    Service: 'Frontline service quality',
    Retraining: 'Staff retraining needs',
  },
  Collection: {
    Outdated: 'Outdated books/materials',
    Old: 'Outdated materials',
    Missing: 'Missing or unlocatable books',
    Textbook: 'Insufficient textbook copies',
    Book: 'Missing/unavailable books',
    Journal: 'Lack of recent research journals/e-resources',
    Database: 'Digital database access issues',
  },
};

// ── Lexicon Topic Priority Action Recommendations ──────────────────────────
export const LEXICON_TOPIC_ACTIONS = {
  'Restroom & Hygiene': {
    action: 'Increase custodial sanitation frequency and maintain consistent supplies of soap, tissues, and paper towels.',
    defaultSeverity: 'HIGH',
  },
  'Air Conditioning': {
    action: 'Conduct HVAC system inspection and temperature regulation to maintain comfortable study and reading conditions.',
    defaultSeverity: 'HIGH',
  },
  'Tables, Seating & Space': {
    action: 'Reconfigure study layouts, repair damaged chairs, and expand quiet individual carrel seating capacity.',
    defaultSeverity: 'MODERATE',
  },
  'Wi-Fi & Power Outlets': {
    action: 'Upgrade Wi-Fi bandwidth access points and install additional electrical outlets/charging stations at study tables.',
    defaultSeverity: 'HIGH',
  },
  'Noise Level & Ambience': {
    action: 'Enforce tiered noise policies in reading areas and install acoustic partitions to minimize study disruptions.',
    defaultSeverity: 'MODERATE',
  },
  'Lighting & Cleanliness': {
    action: 'Replace dim fixtures with high-lumen LEDs and establish regular dusting and trash removal routines.',
    defaultSeverity: 'MODERATE',
  },
  'Hours & Operating Schedule': {
    action: 'Evaluate patron demand for extended evening and weekend hours during midterm and final examination weeks.',
    defaultSeverity: 'MODERATE',
  },
  'Equipments': {
    action: 'Service library computers, barcode scanners, and printer machines to ensure smooth technical operations.',
    defaultSeverity: 'MODERATE',
  },
  'Librarians & Staffs': {
    action: 'Conduct refresher workshops for librarians and desk staff to reinforce courteous, prompt patron assistance.',
    defaultSeverity: 'MODERATE',
  },
  'Security': {
    action: 'Review entrance protocols with security personnel to ensure polite, efficient bag inspections and lobby security.',
    defaultSeverity: 'MODERATE',
  },
  'Service Quality & Attitude': {
    action: 'Address patron customer service feedback and promote approachable, helpful frontline service standards.',
    defaultSeverity: 'HIGH',
  },
  'Digital Resources & E-Books': {
    action: 'Expand subscriptions to academic databases/e-journals and resolve off-campus login authentication issues.',
    defaultSeverity: 'MODERATE',
  },
  'Books & Reference Materials': {
    action: 'Acquire latest editions for high-demand textbooks and conduct collection audits for missing reference materials.',
    defaultSeverity: 'HIGH',
  },
  'Catalogue, OPAC & Search': {
    action: 'Update OPAC catalog indexing and refine shelf call-number signage to help patrons locate titles effortlessly.',
    defaultSeverity: 'MODERATE',
  },
  'Borrowing & Circulation': {
    action: 'Streamline the borrowing/return workflow, clarify overdue policy rules, and enable easy online renewals.',
    defaultSeverity: 'MODERATE',
  },
};
