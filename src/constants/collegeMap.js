export const COLLEGE_OPTIONS = [
  'All', 'Faculty / Staff', 'Guest / Visitor', 'CARES', 'CAS', 'CBA', 'CCS', 'COED', 'COE', 'CHM',
  'CMLS', 'CON', 'COP', 'COL', 'COM', 'COT', 'SGS',
  'SHS', 'JHS', 'ELEM', 'KINDER'
];

export const SECTION_OPTIONS = [
  'All', 'Entrance', 'Reference', 'Circulation', 'Theology', 'Filipiniana',
  'Serials', 'Law', 'American Corner', 'Graduate Studies', 'Cyber Library',
  'Senior High School', 'Junior High School', 'Elementary', 'Kindergarten',
];

export const COLLEGE_MAP_GROUPS = {
  'Faculty / Staff': ['FACULTY', 'STAFF'],
  'Guest / Visitor': ['GUEST', 'VISITOR', 'RESEARCHER'],
  CARES: ['CARES', 'AGRICULTURE', 'ENVIRONMENTAL', 'BSA', 'BSABE', 'BSEM'],
  CAS: ['CAS', 'ARTS', 'SCIENCES', 'BACOMM', 'BAELS', 'BAPOLSCI', 'BSBIO', 'BSCHEM', 'BSPSYC', 'BSSW', 'ABPSPA'],
  CBA: ['CBA', 'BUSINESS', 'ACCOUNTANCY', 'BSACTY', 'BSAD', 'BSBABM', 'BSBAFM', 'BSBAMM', 'BSENT', 'BSBAMA'],
  CCS: ['CCS', 'COMPUTER', 'COMOUTER', 'BSCS', 'BSDMIA', 'BSIT', 'BLIS'],
  COED: ['COED', 'EDUCATION', 'BECED', 'BEED', 'BPED', 'BSBMIC', 'BSED', 'BSMATH'],
  COE: ['COE', 'ENGINEERING', 'BSCE', 'BSCHE', 'BSEE', 'BSECE', 'BSME', 'BSPKGE', 'BSSE'],
  CHM: ['CHM', 'HOSPITALITY', 'BSHM', 'BSTM', 'BSHRM'],
  CMLS: ['CMLS', 'MEDICAL LABORATORY', 'BSMLS'],
  CON: ['CON', 'NURSING', 'BSN'],
  COP: ['COP', 'PHARMACY', 'BSPHAR'],
  COL: ['COL', 'LAW', 'JURIS DOCTOR', 'J.D.', 'LL.B', 'EDD'],
  COM: ['COM', 'MEDICINE', 'RESPIRATORY', 'MD', 'BSRT'],
  COT: ['COT', 'THEOLOGY', 'BTh', 'DipT-S'],
  SGS: ['SGS', 'GRADUATE STUDIES', 'DM', 'DMin', 'DM-THM', 'MAEd', 'MAELL', 'MAEng', 'MAN', 'MBA', 'MBATHM', 'MDiv', 'MEngr', 'MLIS', 'MPA', 'MSAgri', 'MSCS', 'MSGC', 'MSSW'],
  KINDER: ['KINDER', 'KINDERGARTEN'],
  ELEM: ['ELEM', 'ELEMENTARY'],
  JHS: ['JHS', 'JUNIOR HIGH SCHOOL'],
  SHS: ['SHS', 'SENIOR HIGH SCHOOL', 'SHSTEM', 'SHGAS', 'SHHUMSS', 'SHABM']
};

export const inferGuestType = (idNumber, lname, fname) => {
  const id = String(idNumber || '').toUpperCase();
  const ln = String(lname || '').toUpperCase();
  const fn = String(fname || '').toUpperCase();

  if (id.includes('-R') || ln.includes('RESEARCHER') || fn.includes('RESEARCHER')) {
    return 'Researcher';
  }
  if (id.includes('-V') || ln.includes('VISITOR') || fn.includes('VISITOR')) {
    return 'Visitor';
  }
  return 'Visitor';
};

export const getCollegeGroup = (collegeStr, courseStr, logTypeStr, idNumber) => {
  const colClean = (collegeStr || '').trim();
  const crsClean = (courseStr || '').trim();
  const idClean = String(idNumber || '').toUpperCase();

  // If both college and course are empty, or ID matches guest pattern (e.g. 26-V..., 26-R...), infer as Guest / Visitor
  if ((!colClean && !crsClean) || idClean.startsWith('26-V') || idClean.startsWith('26-R') || idClean.includes('-V1') || idClean.includes('-R1')) {
    return 'Guest / Visitor';
  }

  const text = `${colClean} ${crsClean} ${logTypeStr || ''}`.trim().toUpperCase();
  if (!text) return 'Guest / Visitor';

  if (text.includes('FACULTY') || text.includes('STAFF')) {
    return 'Faculty / Staff';
  }
  if (text.includes('GUEST') || text.includes('VISITOR') || text.includes('RESEARCHER')) {
    return 'Guest / Visitor';
  }
  for (const [colCode, terms] of Object.entries(COLLEGE_MAP_GROUPS)) {
    for (const term of terms) {
      if (text.includes(term.toUpperCase())) return colCode;
    }
  }
  return colClean || crsClean || 'N/A';
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [datePart, timePart] = String(dateStr).split(' ');
  if (!datePart || !timePart) return dateStr;
  const [year, month, day] = datePart.split('-');
  const [hour, minute, second] = timePart.split(':');
  const d = new Date(year, month - 1, day, hour, minute, second);
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};
