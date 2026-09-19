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

  // fallback to guest/visitor if empty or matches guest id pattern (e.g. 26-V, 26-R)
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

export const getPSTDateString = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(date);
};

export const getPSTDatePresets = (targetYear = '2026') => {
  const pstStr = getPSTDateString();
  const [y, m, d] = pstStr.split('-').map(Number);
  // noon utc so dates don't shift across timezones
  const todayD = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = todayD.getUTCDay();
  const diffToMonday = d - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const mondayD = new Date(Date.UTC(y, m - 1, diffToMonday, 12, 0, 0));
  const startOfWeek = getPSTDateString(mondayD);
  const startOfMonth = `${y}-${String(m).padStart(2, '0')}-01`;
  const endOfMonthD = new Date(Date.UTC(y, m, 0, 12, 0, 0));
  const endOfMonth = getPSTDateString(endOfMonthD);
  return { today: pstStr, startOfWeek, startOfMonth, endOfMonth };
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [datePart, timePart] = String(dateStr).split(' ');
  if (!datePart || !timePart) return dateStr;
  const [year, month, day] = datePart.split('-');
  const [hour, minute, second] = timePart.split(':');
  // parse as utc+8 (philippine time)
  const isoStr = `${year}-${month}-${day}T${hour}:${minute}:${second ? second.slice(0, 2) : '00'}+08:00`;
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

