/**
 * @fileoverview
 * createReferal.js: הקוד של דף יצירת הפניה (createReferal.html), לרופאה בלבד
 * מה הוא עושה: בדיקות קלט תוך כדי הקלדה (ת"ז, תיאור, קובץ), בחירת קובץ בלחיצה או בגרירה,
 * ושליחת הטופס לשרת דרך referalService, עם מסך הצלחה או הודעת שגיאה
 * מסלול הבקשה: createReferal.html -> createReferal.js -> referalService.js -> POST /api/referals
 * תלוי במזהים (id) שבקובץ createReferal.html, ובשמות השדות שנשלחים לשרת
 * patientTz, kindReferal, description, attachedFile
 * השמות חייבים להיות זהים לסכמת Joi ול-multer בשרת
 */
import { createReferal } from '../services/referalService.js'
import { TOKEN_KEY } from '../services/config.js'

// קיצור: שליפת אלמנט מהדף לפי מזהה
const $ = (id) => document.getElementById(id)

// כללי הקובץ המצורף. חייבים להיות זהים להגדרות multer בשרת (middlewares/files.middleware.js)
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
// אורך תיאור מינימלי, כמו בבדיקת התקינות בשרת
const MIN_DESCRIPTION = 5

// אלמנטים שהקוד עובד איתם הרבה
const form = $('referal-form')
const tzInput = $('patientTz')
const descInput = $('description')
const fileInput = $('attachedFile')

// מצב הדף: הקובץ שנבחר ואושר (או null), ודגל שמונע שליחה כפולה בזמן שבקשה בדרך
let selectedFile = null
let sending = false

/* ---------- עזרים ---------- */
/**
 * מה היא עושה: ממירה גודל בבתים לטקסט קריא
 * מתחת ל-1MB מציגה ב-KB (לפחות 1KB), ומעל זה ב-MB עם ספרה אחת אחרי הנקודה
 * משמשת את כרטיס הקובץ והודעת השגיאה על קובץ גדול מדי
 *
 * @param {number} bytes גודל הקובץ בבתים
 * @returns {string} למשל 250 KB או 1.4 MB
 */
const formatSize = (bytes) => bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

/**
 * מה היא עושה: מציגה או מסתירה את השגיאה הכללית שמעל כפתור השליחה
 * משמשת את בדיקות השליחה ואת הודעות השגיאה מהשרת
 *
 * @param {string} message הטקסט להצגה. מחרוזת ריקה מסתירה את השגיאה
 * @returns {void}
 */
function showFormError(message) {
    $('formErrorText').textContent = message
    $('formError').hidden = !message
}

/* ---------- תעודת זהות ---------- */
/**
 * מה היא עושה: בודקת את תעודת הזהות ומעדכנת את מראה השדה: צבע, אייקון וטקסט עזר
 * תעודת זהות תקינה היא 9 ספרות בדיוק
 * שדה ריק נשאר ניטרלי בזמן הקלדה, ובשליחה נחשב שגיאה
 * משמשת את ההקלדה בשדה, את השליחה, ואת האיפוס
 *
 * @param {boolean} [showEmptyAsNeutral=true] אמת: שדה ריק נשאר ניטרלי. שקר: שדה ריק נחשב שגיאה
 * @returns {boolean} אמת אם תעודת הזהות תקינה
 */
function validateTz(showEmptyAsNeutral = true) {
    const value = tzInput.value.trim()
    const wrap = $('tzWrap')
    const status = $('tzStatus')
    const hint = $('tzHint')

    wrap.classList.remove('is-valid', 'is-invalid')
    status.className = 'bi input-status'
    hint.classList.remove('is-error')

    if (value === '' && showEmptyAsNeutral) {
        hint.textContent = 'הזינו תעודת זהות של מטופל/ת שרשום/ה במערכת.'
        return false
    }
    if (/^\d{9}$/.test(value)) {
        wrap.classList.add('is-valid')
        status.classList.add('bi-check-circle-fill')
        hint.textContent = 'תעודת הזהות תקינה.'
        return true
    }
    wrap.classList.add('is-invalid')
    status.classList.add('bi-x-circle-fill')
    hint.classList.add('is-error')
    hint.textContent = /\D/.test(value) ? 'יש להזין ספרות בלבד.' : `יש להזין 9 ספרות (הוזנו ${value.length}).`
    return false
}

// בזמן הקלדה: משאירים ספרות בלבד, חותכים ל-9 תווים, בודקים, ומנקים שגיאה כללית קודמת
tzInput.addEventListener('input', () => {
    tzInput.value = tzInput.value.replace(/\D/g, '').slice(0, 9)
    validateTz()
    showFormError('')
})

/* ---------- תיאור ---------- */
/**
 * מה היא עושה: מעדכנת את מונה התווים ואת טקסט העזר של התיאור, ובודקת שהתיאור מספיק ארוך
 * האורך נמדד אחרי הסרת רווחים בקצוות, כך שרווחים בלבד לא נחשבים
 * משמשת את ההקלדה בתיאור, את השליחה ואת האיפוס
 *
 * @returns {boolean} אמת אם התיאור באורך תקין
 */
function updateDescription() {
    const length = descInput.value.trim().length
    $('descCount').textContent = `${descInput.value.length} / ${descInput.maxLength}`
    const short = length > 0 && length < MIN_DESCRIPTION
    $('descHint').textContent = short ? `עוד ${MIN_DESCRIPTION - length} תווים לפחות` : 'לפחות 5 תווים'
    $('descHint').classList.toggle('is-error', short)
    return length >= MIN_DESCRIPTION
}
// בזמן הקלדה בתיאור: מעדכנים מונה ובדיקה, ומנקים שגיאה כללית
descInput.addEventListener('input', () => { updateDescription(); showFormError('') })

/* ---------- סוג הפניה ---------- */
// כשבוחרים סוג הפניה, מנקים שגיאה כללית (למשל: יש לבחור סוג הפניה)
document.querySelectorAll('input[name="kindReferal"]').forEach((radio) => {
    radio.addEventListener('change', () => showFormError(''))
})

/* ---------- קובץ ---------- */
/**
 * מה היא עושה: מבטלת את הקובץ שנבחר
 * מאפסת את המצב ואת שדה הקובץ עצמו, כדי שקובץ שנדחה לא יישלח בטעות עם הטופס, ומסתירה את כרטיס הקובץ
 * משמשת את הסרת הקובץ, את דחיית קובץ ואת איפוס הטופס
 *
 * @returns {void}
 */
function clearFile() {
    selectedFile = null
    fileInput.value = ''
    $('fileChip').classList.remove('is-visible')
}

/**
 * מה היא עושה: דוחה קובץ. מבטלת אותו ומציגה הודעת שגיאה מתחת לאזור ההעלאה
 * משמשת את setFile כשהסוג או הגודל לא תקינים
 *
 * @param {string} message הסיבה לדחייה
 * @returns {void}
 */
function rejectFile(message) {
    clearFile()
    const error = $('fileError')
    error.textContent = message
    error.hidden = false
}

/**
 * מה היא עושה: מאשרת קובץ שנבחר, בלחיצה או בגרירה
 * בודקת סוג (PDF, JPG או PNG) וגודל (עד 5MB)
 * קובץ תקין נשמר ומוצג בכרטיס עם שם וגודל. קובץ לא תקין נדחה עם הודעה. ערך ריק מבטל את הבחירה
 * למה צריך: בדיקה מהירה בדפדפן, לפני ששולחים. הבדיקה האמיתית נעשית שוב בשרת
 *
 * @param {File|null} file הקובץ שנבחר, או null לביטול
 * @returns {void}
 */
function setFile(file) {
    $('fileError').hidden = true

    if (!file) return clearFile()
    if (!ALLOWED_TYPES.includes(file.type)) return rejectFile('אפשר לצרף רק קובץ PDF, JPG או PNG.')
    if (file.size > MAX_SIZE) return rejectFile(`הקובץ גדול מדי (${formatSize(file.size)}). המקסימום הוא 5MB.`)

    selectedFile = file
    $('fileName').textContent = file.name
    $('fileSize').textContent = formatSize(file.size)
    $('fileChip').classList.add('is-visible')
}

// בחירת קובץ בלחיצה (חלון בחירת קבצים), והסרה בכפתור שבכרטיס הקובץ
fileInput.addEventListener('change', () => setFile(fileInput.files[0] || null))
$('fileRemove').addEventListener('click', () => setFile(null))

// גרירת קובץ לאזור ההעלאה
// בגרירה מונעים את ברירת המחדל של הדפדפן, כדי שהוא לא יפתח את הקובץ במקום להפיל אותו כאן
const dropzone = $('dropzone')
    ;['dragenter', 'dragover'].forEach((type) => dropzone.addEventListener(type, (event) => {
        event.preventDefault()
        dropzone.classList.add('is-dragover')
    }))
    ;['dragleave', 'drop'].forEach((type) => dropzone.addEventListener(type, (event) => {
        event.preventDefault()
        dropzone.classList.remove('is-dragover')
    }))
// בעת הנחת הקובץ: לוקחים את הקובץ הראשון ומציבים אותו גם בשדה הקובץ עצמו
// כי גרירה לא מעדכנת אותו לבד, ובלי זה הקובץ לא היה נכלל בטופס שנשלח
dropzone.addEventListener('drop', (event) => {
    const file = event.dataTransfer?.files?.[0]
    if (!file) return
    // מעדכנים גם את ה-input עצמו, כדי שהקובץ ייכלל ב-FormData
    const transfer = new DataTransfer()
    transfer.items.add(file)
    fileInput.files = transfer.files
    setFile(file)
})

/* ---------- שליחה ---------- */
/**
 * מה היא עושה: שולחת את ההפניה, לפי הסדר
 * 1. מונעת רענון דף ושליחה כפולה
 * 2. בודקת בלקוח: ת"ז, סוג הפניה, תיאור, ושיש טוקן
 * 3. בונה את הטופס לשליחה (בלי חלק הקובץ אם לא נבחר קובץ)
 * 4. שולחת דרך referalService, עם ספינר על הכפתור
 * 5. הצלחה: מסך הצלחה. שגיאה: הודעה (401 הוא טוקן שפג, ושגיאת TypeError היא תקלת רשת)
 * 6. בסוף מחזירה את הכפתור למצב רגיל
 * הבדיקות כאן לחוויה מהירה. הבדיקה האמיתית והאבטחה נעשות בשרת
 *
 * @param {SubmitEvent} event אירוע שליחת הטופס
 * @returns {Promise<void>}
 */
form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (sending) return
    showFormError('')

    const tzOk = validateTz(false)
    const kind = form.querySelector('input[name="kindReferal"]:checked')
    const descOk = updateDescription()

    if (!tzOk) { tzInput.focus(); return showFormError('יש להזין תעודת זהות תקינה של 9 ספרות.') }
    if (!kind) { return showFormError('יש לבחור סוג הפניה.') }
    if (!descOk) { descInput.focus(); return showFormError(`התיאור חייב להכיל לפחות ${MIN_DESCRIPTION} תווים.`) }

    if (!localStorage.getItem(TOKEN_KEY)) {
        $('authNotice').hidden = false
        return showFormError('צריך להתחבר כרופא/ה כדי לשלוח הפניה.')
    }

    const formData = new FormData(form)
    if (!selectedFile) formData.delete('attachedFile')

    sending = true
    const button = $('submitBtn')
    button.disabled = true
    const spinner = document.createElement('span')
    spinner.className = 'spinner-border me-2'
    button.replaceChildren(spinner, document.createTextNode(' שולח...'))

    try {
        await createReferal(formData)
        $('okTz').textContent = tzInput.value
        $('okKind').textContent = kind.value
        $('okFile').textContent = selectedFile ? selectedFile.name : 'ללא'
        $('formView').hidden = true
        $('successView').hidden = false
        window.scrollTo({ top: 0, behavior: 'smooth' })
        $('successTitle').setAttribute('tabindex', '-1')
        $('successTitle').focus({ preventScroll: true })
    } catch (error) {
        if (error.status === 401) {
            $('authNotice').hidden = false
            $('authNoticeText').textContent = 'פג תוקף ההתחברות. התחברו מחדש כדי להמשיך.'
        }
        showFormError(error instanceof TypeError ? 'שגיאת תקשורת. ודאו שהשרת פועל ונסו שוב.' : error.message)
    } finally {
        sending = false
        button.disabled = false
        button.textContent = 'שליחת ההפניה'
    }
})

/* ---------- הפניה נוספת ---------- */
// הפניה נוספת: מאפסים את הטופס והסטטוסים וחוזרים לטופס, עם פוקוס על שדה תעודת הזהות
$('againBtn').addEventListener('click', () => {
    form.reset()
    setFile(null)
    validateTz()
    updateDescription()
    showFormError('')
    $('successView').hidden = true
    $('formView').hidden = false
    tzInput.focus()
})

// אתחול הדף: אם אין טוקן מציגים מיד שצריך להתחבר, ומעדכנים את מונה התיאור
if (!localStorage.getItem(TOKEN_KEY)) $('authNotice').hidden = false
updateDescription()
