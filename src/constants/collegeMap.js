export const COLLEGE_OPTIONS = [
  'All', 'CARES', 'CAS', 'CBA', 'CCS', 'COED', 'COE', 'CHM',
  'CMLS', 'CON', 'COP', 'COL', 'COM', 'COT', 'SGS',
  'SHS', 'JHS', 'ELEM', 'KINDER'
];

export const SECTION_OPTIONS = [
  'All', 'Entrance', 'Reference', 'Circulation', 'Theology', 'Filipiniana',
  'Serials', 'Law', 'American Corner', 'Graduate Studies', 'Cyber Library',
  'Senior High School', 'Junior High School', 'Elementary', 'Kindergarten',
];

export const COLLEGE_MAP_GROUPS = {
  CARES: ['CARES', 'AGRICULTURE', 'ENVIRONMENTAL', 'BSA', 'BSABE', 'BSEM'],
  CAS: ['CAS', 'ARTS', 'SCIENCES', 'BACOMM', 'BAELS', 'BAPOLSCI', 'BSBIO', 'BSCHEM', 'BSPSYC', 'BSSW', 'ABPSPA'],
  CBA: ['CBA', 'BUSINESS', 'ACCOUNTANCY', 'BSACTY', 'BSAD', 'BSBABM', 'BSBAFM', 'BSBAMM', 'BSENT', 'BSBAMA'],
  CCS: ['CCS', 'COMPUTER', 'BSCS', 'BSDMIA', 'BSIT', 'BLIS'],
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

export const getCollegeGroup = (collegeStr, courseStr) => {
  const text = `${collegeStr || ''} ${courseStr || ''}`.trim().toUpperCase();
  if (!text) return 'N/A';
  for (const [colCode, terms] of Object.entries(COLLEGE_MAP_GROUPS)) {
    for (const term of terms) {
      if (text.includes(term.toUpperCase())) return colCode;
    }
  }
  return collegeStr || courseStr || 'N/A';
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
