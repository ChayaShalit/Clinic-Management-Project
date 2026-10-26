import { getMySchedule, saveMySchedule, hasToken } from '../services/doctorScheduleService.js'

/**
 * @fileoverview
 * דף שעות העבודה של הרופא
 * הרופא רואה ומשנה שעות עבודה, אורך תור, יום חופש והפסקות
 * הדף מדבר עם השרת פעמיים: בפתיחה הוא שולף את השעות הקיימות, ובשמירה הוא שולח את החדשות
 * שתי הפניות עוברות דרך קובץ השירות של שעות העבודה
 * GET /api/doctors/me/schedule
 * PUT /api/doctors/me/schedule
 */

/**
 * קיצור לשליפת אלמנט מהדף לפי המזהה שלו
 *
 * @param {string} id המזהה של האלמנט
 * @returns {HTMLElement} האלמנט מהדף
 */
const $ = (id) => document.getElementById(id)

const form = $('schedule-form')
const breaksList = $('breaksList')
const noBreaks = $('noBreaks')
const submitBtn = $('submitBtn')

// מונה שנותן לכל שדה הפסקה מזהה ייחודי, כדי לחבר כל תווית לשדה שלה
let breakCounter = 0

/**
 * הופכת שעה למספר דקות, כדי שאפשר יהיה להשוות שעות
 *
 * @param {string} hhmm שעה בצורה של שעות ודקות
 * @returns {number} מספר הדקות מתחילת היום
 */
const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number)
    return h * 60 + m
}

/**
 * מסתירה את תיבות ההודעות, גם של הצלחה וגם של שגיאה
 */
const hideNotices = () => {
    $('formError').hidden = true
    $('formSuccess').hidden = true
}

/**
 * מציגה הודעת שגיאה בתיבה האדומה, ומסתירה את תיבת ההצלחה
 *
 * @param {string} text הטקסט להצגה
 */
const showError = (text) => {
    $('formSuccess').hidden = true
    $('formErrorText').textContent = text
    $('formError').hidden = false
}

/**
 * מציגה הודעת הצלחה בתיבה הירוקה, ומסתירה את תיבת השגיאה
 *
 * @param {string} text הטקסט להצגה
 */
const showSuccess = (text) => {
    $('formError').hidden = true
    $('formSuccessText').textContent = text
    $('formSuccess').hidden = false
}

/**
 * מציגה הודעה שצריך להתחבר כרופא
 * וגם נועלת את כפתור השמירה, כי בלי התחברות אי אפשר לשמור
 *
 * @param {string} [text] הטקסט להצגה, לא חובה
 */
const showAuthNotice = (text) => {
    if (text) $('authNoticeText').textContent = text
    $('authNotice').hidden = false
    submitBtn.disabled = true
}

/**
 * מה היא עושה: בונה שדה שעה אחד עם תווית, לשורת הפסקה
 * התווית מחוברת לשדה בעזרת מזהה ייחודי, כדי שקוראי מסך יבינו מה כל שדה
 *
 * @param {string} labelText טקסט התווית
 * @param {string} value הערך ההתחלתי של השעה
 * @param {string} inputClass שם עיצוב שמזהה את השדה
 * @returns {HTMLElement} העמודה עם התווית והשדה
 */
function createTimeField(labelText, value, inputClass) {
    breakCounter += 1
    const inputId = `break-time-${breakCounter}`

    const col = document.createElement('div')
    col.className = 'col-5'

    const label = document.createElement('label')
    label.className = 'form-label small mb-1'
    label.htmlFor = inputId
    label.textContent = labelText

    const input = document.createElement('input')
    input.type = 'time'
    input.id = inputId
    input.className = `form-control ${inputClass}`
    input.value = value
    input.required = true

    col.append(label, input)
    return col
}

/**
 * מה היא עושה: בונה שורה שלמה של הפסקה: שעת התחלה, שעת סיום וכפתור מחיקה
 * לחיצה על המחיקה מסירה את השורה ומעדכנת את הודעת אין הפסקות
 * משמשת גם כשממלאים את הטופס מהשרת, וגם כשהרופא מוסיף הפסקה חדשה
 *
 * @param {string} [startTime] שעת ההתחלה, ברירת מחדל ריקה
 * @param {string} [endTime] שעת הסיום, ברירת מחדל ריקה
 * @returns {HTMLElement} שורת ההפסקה
 */
function createBreakRow(startTime = '', endTime = '') {
    const row = document.createElement('div')
    row.className = 'row g-2 align-items-end mb-2 break-row'

    const removeCol = document.createElement('div')
    removeCol.className = 'col-2'

    const removeBtn = document.createElement('button')
    removeBtn.type = 'button'
    removeBtn.className = 'btn btn-outline-danger w-100'
    removeBtn.setAttribute('aria-label', 'מחיקת הפסקה')

    const icon = document.createElement('i')
    icon.className = 'bi bi-trash'
    icon.setAttribute('aria-hidden', 'true')
    removeBtn.append(icon)

    removeBtn.addEventListener('click', () => {
        row.remove()
        updateEmptyState()
    })

    removeCol.append(removeBtn)
    row.append(
        createTimeField('התחלת הפסקה', startTime, 'break-start'),
        createTimeField('סיום הפסקה', endTime, 'break-end'),
        removeCol
    )
    return row
}

/**
 * מציגה את הודעה אין הפסקות רק כשאין אף שורת הפסקה
 */
function updateEmptyState() {
    noBreaks.hidden = breaksList.children.length > 0
}

/**
 * מה היא עושה: ממלאת את הטופס בשעות שהתקבלו מהשרת
 * מי קורא לה: הפונקציה שפותחת את הדף, ואחרי שמירה מוצלחת
 *
 * @param {Object} schedule שעות העבודה מהשרת
 */
function fillForm(schedule) {
    $('workStartTime').value = schedule.workStartTime || ''
    $('workEndTime').value = schedule.workEndTime || ''
    $('appointmentDuration').value = schedule.appointmentDuration || ''
    $('dayOff').value = schedule.dayOff || ''

    breaksList.replaceChildren(
        ...(schedule.breaks || []).map(b => createBreakRow(b.startTime, b.endTime))
    )
    updateEmptyState()
}

/**
 * מה היא עושה: קוראת את מה שמולא בטופס ובונה אובייקט שאפשר לשלוח לשרת
 * זה בדיוק המבנה שהשרת מצפה לקבל
 *
 * @returns {Object} שעות העבודה כפי שמולאו בטופס
 */
function readForm() {
    return {
        workStartTime: $('workStartTime').value,
        workEndTime: $('workEndTime').value,
        appointmentDuration: Number($('appointmentDuration').value),
        dayOff: $('dayOff').value,
        breaks: [...breaksList.querySelectorAll('.break-row')].map(row => ({
            startTime: row.querySelector('.break-start').value,
            endTime: row.querySelector('.break-end').value
        }))
    }
}

/**
 * מה היא עושה: בודקת בצד הלקוח כללים שהטופס לבדו לא יכול לבדוק
 * הסיום אחרי ההתחלה, וההפסקות בתוך שעות העבודה
 * מחזירה טקסט שגיאה, או טקסט ריק כשהכול תקין
 * השרת בודק את אותם כללים שוב, כי אי אפשר לסמוך רק על הדפדפן
 *
 * @param {Object} data שעות העבודה מהטופס
 * @returns {string} טקסט שגיאה, או טקסט ריק כשהכול תקין
 */
function validate(data) {
    const start = toMinutes(data.workStartTime)
    const end = toMinutes(data.workEndTime)

    if (start >= end) {
        return 'שעת הסיום חייבת להיות אחרי שעת ההתחלה'
    }

    for (const b of data.breaks) {
        const breakStart = toMinutes(b.startTime)
        const breakEnd = toMinutes(b.endTime)

        if (breakStart >= breakEnd) {
            return 'בכל הפסקה, הסיום חייב להיות אחרי ההתחלה'
        }

        if (breakStart < start || breakEnd > end) {
            return 'ההפסקות חייבות להיות בתוך שעות העבודה'
        }
    }

    return ''
}

// כפתור הוספת הפסקה: מוסיף שורה ריקה וממקד את הסמן בה
$('addBreakBtn').addEventListener('click', () => {
    breaksList.append(createBreakRow())
    updateEmptyState()
    breaksList.lastElementChild.querySelector('input').focus()
})

// מה קורה בלחיצה על שמירה
// עוצרים את הטעינה מחדש של הדף, קוראים את הטופס ובודקים אותו
// אם תקין, שולחים לשרת, ומציגים הצלחה או שגיאה
// שגיאת התחברות מציגה הודעה להתחבר, ושגיאת תקשורת מציגה הודעה שהשרת לא זמין
// הכפתור ננעל בזמן השמירה כדי שלא ישלחו פעמיים
// PUT /api/doctors/me/schedule
form.addEventListener('submit', async (e) => {
    e.preventDefault()
    hideNotices()

    const data = readForm()
    const problem = validate(data)

    if (problem) {
        showError(problem)
        return
    }

    submitBtn.disabled = true
    submitBtn.textContent = 'שומר...'

    try {
        const saved = await saveMySchedule(data)
        fillForm(saved)
        showSuccess('מטופלים ומטופלות יראו את השינוי ביומן מיד.')
    } catch (error) {
        console.error(error.message)

        if (error.status === 401 || error.status === 403) {
            showAuthNotice('רק רופאים מחוברים יכולים לעדכן שעות עבודה.')
        } else if (error instanceof TypeError) {
            showError('שגיאת תקשורת מול השרת. כדאי לוודא שהשרת פועל.')
        } else {
            showError(error.message)
        }
    } finally {
        if ($('authNotice').hidden) submitBtn.disabled = false
        submitBtn.textContent = 'שמירת שעות העבודה'
    }
})

/**
 * מה היא עושה: מה שקורה כשהדף נפתח
 * בלי טוקן מציגה הודעה להתחבר, ועם טוקן שולפת את השעות מהשרת וממלאת את הטופס
 * GET /api/doctors/me/schedule
 *
 * @returns {Promise<void>} לא מחזירה ערך
 */
async function init() {
    if (!hasToken()) {
        showAuthNotice()
        return
    }

    try {
        fillForm(await getMySchedule())
    } catch (error) {
        console.error(error.message)

        if (error.status === 401 || error.status === 403) {
            showAuthNotice('רק רופאים מחוברים יכולים לעדכן שעות עבודה.')
        } else if (error instanceof TypeError) {
            showError('שגיאת תקשורת מול השרת. כדאי לוודא שהשרת פועל.')
        } else {
            showError(error.message)
        }
    }
}

// מפעילים את הפתיחה כשהדף נטען
init()
