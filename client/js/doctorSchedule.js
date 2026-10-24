import { getMySchedule, saveMySchedule, hasToken } from '../services/doctorScheduleService.js'

const $ = (id) => document.getElementById(id)

const form = $('schedule-form')
const breaksList = $('breaksList')
const noBreaks = $('noBreaks')
const submitBtn = $('submitBtn')

let breakCounter = 0

const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number)
    return h * 60 + m
}

/* ---------- הודעות ---------- */
const hideNotices = () => {
    $('formError').hidden = true
    $('formSuccess').hidden = true
}

const showError = (text) => {
    $('formSuccess').hidden = true
    $('formErrorText').textContent = text
    $('formError').hidden = false
}

const showSuccess = (text) => {
    $('formError').hidden = true
    $('formSuccessText').textContent = text
    $('formSuccess').hidden = false
}

const showAuthNotice = (text) => {
    if (text) $('authNoticeText').textContent = text
    $('authNotice').hidden = false
    submitBtn.disabled = true
}

/* ---------- הפסקות: שורה אחת בטופס ---------- */
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

function updateEmptyState() {
    noBreaks.hidden = breaksList.children.length > 0
}

/* ---------- קריאה וכתיבה של נתוני הטופס ---------- */
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

// בדיקות שלא ניתן לעשות ב-HTML בלבד. מחזירה טקסט שגיאה, או מחרוזת ריקה אם הכול תקין
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

/* ---------- אירועים ---------- */
$('addBreakBtn').addEventListener('click', () => {
    breaksList.append(createBreakRow())
    updateEmptyState()
    breaksList.lastElementChild.querySelector('input').focus()
})

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
        // אם הוצגה הודעת התחברות, הכפתור נשאר חסום
        if ($('authNotice').hidden) submitBtn.disabled = false
        submitBtn.textContent = 'שמירת שעות העבודה'
    }
})

/* ---------- טעינה ראשונית ---------- */
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

init()
