import { requireAuth, logout } from '../services/authService.js';
import { getUserProfile,updateUserProfile, uploadProfileImage } from '../services/profileService.js';
import { UPLOADS_URL, HOME_BY_ROLE } from '../services/config.js';



// מציגה הודעה בתוך אלמנט קיים בדף
//   el        - האלמנט (למשל <div id="apiMessage">)
//   text      - הטקסט להצגה
//   isSuccess - true להצלחה (ירוק), false לשגיאה (אדום)
export function showMessage(el, text, isSuccess) {
    el.textContent = text;
    el.className = isSuccess
        ? 'alert alert-success msg-success'
        : 'alert alert-danger msg-error';
    el.style.display = 'block';
}


const ROLE_LABEL = { patient: 'מטופל/ת', doctor: 'רופא/ה' };
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// תמונת ברירת מחדל מובנית, כדי לא להיות תלויות בקובץ png
const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
  '<rect width="120" height="120" fill="#e8f1fb"/>' +
  '<circle cx="60" cy="46" r="22" fill="#9db8d6"/>' +
  '<path d="M16 120c0-26 20-44 44-44s44 18 44 44z" fill="#9db8d6"/></svg>'
);

// שדות טקסט שמותר לרוקן. שאר השדות הריקים לא נשלחים לשרת
const CLEARABLE = ['phone', 'medicalNotes', 'specialty'];

const role = requireAuth();                 // שני התפקידים מורשים
if (!role) throw new Error('not authenticated');

const $ = (id) => document.getElementById(id);
const form = $('profileForm');
const img = $('profileImg');
const msg = $('apiMessage');
const saveBtn = $('saveBtn');
const imageInput = $('imageInput');

/* ---------- התאמת הדף לתפקיד ---------- */
document.querySelector('main').classList.add(`role-${role}`);
$('homeLink').href = HOME_BY_ROLE[role];
$('roleBadge').textContent = ROLE_LABEL[role];
$('logout').addEventListener('click', logout);

// מציגים רק את קבוצת השדות של התפקיד. fieldset מנוטרל לא נשלח ב-FormData
document.querySelectorAll('[data-role]').forEach((section) => {
  const active = section.dataset.role === role;
  section.hidden = !active;
  section.disabled = !active;
});

if (role === 'patient') {
  $('dateBirth').max = new Date().toISOString().slice(0, 10);   // לא בעתיד
  $('medicalNotes').addEventListener('input', updateNotesCount);
}



/* ---------- עזרים ---------- */
function setAvatar(fileName) {
  img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER; };
  img.src = fileName && fileName !== 'default-profile.png'
    ? `${UPLOADS_URL}/${fileName}`
    : PLACEHOLDER;
}

function updateNotesCount() {
  $('notesCount').textContent = $('medicalNotes').value.length;
}


// בונה את מה שנשלח לשרת
function buildPayload() {
  const data = Object.fromEntries(new FormData(form));   // אימייל וקבוצת התפקיד השני לא נכללים
  for (const [key, value] of Object.entries(data)) {
    if (value === '' && !CLEARABLE.includes(key)) delete data[key];
  }
  if (role === 'doctor') data.dayOff = data.dayOff || null;   // null = ללא יום חופשי
  return data;
}

const errorText = (error) =>
  error instanceof TypeError ? 'שגיאת תקשורת מול השרת.' : error.message;

/* ---------- טעינת הפרופיל ---------- */
async function loadProfile() {
  setAvatar(null);
  try {
    const { profile } = await getUserProfile();
    const { user, details } = profile;

    const values = { ...details, ...user };
    values.dateBirth = values.dateBirth?.slice(0, 10);   // YYYY-MM-DD לשדה date

    // form.elements[key] ולא form.name: לטופס יש מאפיין מובנה בשם name
    for (const [key, value] of Object.entries(values)) {
      const field = form.elements[key];
      if (field && 'value' in field) field.value = value ?? '';
    }

    $('displayName').textContent = user.name;
    setAvatar(user.profileImage);
    if (role === 'patient') updateNotesCount();
  } catch (error) {
    showMessage(msg, errorText(error), false);
  }
}

/* ---------- שמירת פרטים ---------- */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;            // ולידציה בצד לקוח

  saveBtn.disabled = true;
  saveBtn.textContent = 'שומר...';
  msg.style.display = 'none';

  try {
    const { profile } = await updateUserProfile(buildPayload());
    localStorage.setItem('userName', profile.user.name);   // שהברכה בדף הבית תתעדכן
    $('displayName').textContent = profile.user.name;
    showMessage(msg, 'הפרופיל עודכן בהצלחה', true);
  } catch (error) {
    showMessage(msg, errorText(error), false);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'שמירת שינויים';
  }
});

/* ---------- תמונת פרופיל ---------- */
$('changeImageBtn').addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', async () => {
  const file = imageInput.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    return showMessage(msg, 'אפשר להעלות רק קובץ תמונה.', false);
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return showMessage(msg, 'התמונה גדולה מדי (עד 5MB).', false);
  }

  try {
    const { profileImage } = await uploadProfileImage(file);
    setAvatar(profileImage);
    showMessage(msg, 'התמונה עודכנה בהצלחה', true);
  } catch (error) {
    showMessage(msg, errorText(error), false);
  } finally {
    imageInput.value = '';   // מאפשר לבחור שוב את אותו קובץ
  }
});

loadProfile();