import { getDoctors, getAvailability, bookAppointment, hasToken } from '../services/appointmentService.js'

/**
 * @fileoverview
 * דף היומן לקביעת תור: המטופלת בוחרת רופא, יום, שעה וסוג טיפול
 * הדף מדבר עם השרת בשלושה מקרים
 * GET /api/doctors
 * GET /api/appointments/availability?doctorId=...&date=...
 * POST /api/appointments
 * הראשון מביא את הרופאים ושעות העבודה שלהם, השני את השעות התפוסות ביום שנבחר, והשלישי קובע את התור
 * את השעות הפנויות מחשב הדף עצמו, משעות העבודה פחות הפסקות פחות שעות תפוסות
 */

/**
 * קיצור לשליפת אלמנט מהדף לפי המזהה שלו
 *
 * @param {string} id המזהה של האלמנט
 * @returns {HTMLElement} האלמנט מהדף
 */
const $ = (id) => document.getElementById(id)

// שמות הימים באנגלית, כמו שהם נשמרים אצל הרופא כיום חופש
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
// שמות הימים בעברית להצגה
const WEEKDAYS_HE = { Sunday: 'ראשון', Monday: 'שני', Tuesday: 'שלישי', Wednesday: 'רביעי', Thursday: 'חמישי', Friday: 'שישי', Saturday: 'שבת' }
// כמה ימים קדימה אפשר לקבוע תור
const MAX_DAYS_AHEAD = 90

// המצב של הדף: כל מה שהמטופלת בחרה עד עכשיו
// רשימת הרופאים, הרופא שנבחר, החודש שמוצג, היום, השעה וסוג הטיפול
// וגם השעות התפוסות ויש סימון שתור נקבע כרגע
// כל שינוי במצב מתעדכן במסך דרך פונקציית הסנכרון
const state = {
    doctors: [],
    doctor: null,
    month: null,
    date: null,
    time: null,
    type: '',
    taken: [],
    booking: false
}

/**
 * משלימה מספר לשתי ספרות, למשל תשע הופך לאפס תשע
 *
 * @param {number} n המספר
 * @returns {string} המספר בשתי ספרות
 */
const pad = (n) => String(n).padStart(2, '0')
/**
 * הופכת תאריך לטקסט של שנה, חודש ויום, כמו שהשרת מצפה לקבל
 *
 * @param {Date} d התאריך
 * @returns {string} שנה חודש ויום כטקסט
 */
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
/**
 * הפעולה ההפוכה: הופכת טקסט של תאריך לתאריך
 *
 * @param {string} key תאריך כטקסט של שנה חודש ויום
 * @returns {Date} התאריך
 */
const parseKey = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d) }
/**
 * הופכת שעה למספר דקות, כדי לחשב ולהשוות שעות
 *
 * @param {string} hhmm שעה בצורה של שעות ודקות
 * @returns {number} מספר הדקות מתחילת היום
 */
const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
/**
 * הפעולה ההפוכה: הופכת מספר דקות לשעה כמו שמציגים
 *
 * @param {number} min מספר הדקות מתחילת היום
 * @returns {string} השעה בצורה של שעות ודקות
 */
const toHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
/**
 * הופכת תאריך לטקסט ארוך בעברית עם שם היום
 *
 * @param {string} key תאריך כטקסט של שנה חודש ויום
 * @returns {string} תאריך ארוך בעברית
 */
const longDate = (key) => parseKey(key).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
/**
 * מחזירה את תחילת היום של היום, בלי שעות ודקות, כדי להשוות ימים
 *
 * @returns {Date} תחילת היום של היום
 */
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
/**
 * מחזירה את האותיות הראשונות של השם, לעיגול ליד שם הרופא
 *
 * @param {string} name השם המלא
 * @returns {string} האותיות הראשונות
 */
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('')

/**
 * כלי לבניית אלמנט בדף: סוג, עיצוב וטקסט, בלי לכתוב קוד ארוך כל פעם
 *
 * @param {string} tag סוג האלמנט
 * @param {string} [className] שם עיצוב
 * @param {string} [text] טקסט
 * @returns {HTMLElement} האלמנט שנבנה
 */
const el = (tag, className, text) => {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text !== undefined) node.textContent = text
    return node
}

/**
 * מציגה שלב בדף כנעול, כשהושלם, או כפעיל, לפי המצב
 *
 * @param {string} id מזהה השלב בדף
 * @param {Object} flags מצב השלב
 * @param {boolean} flags.locked האם נעול
 * @param {boolean} flags.done האם הושלם
 * @param {boolean} flags.active האם פעיל
 */
function setStep(id, { locked, done, active }) {
    const card = $(id)
    card.classList.toggle('is-locked', locked)
    card.classList.toggle('is-done', done)
    card.classList.toggle('is-active', active)
}

/**
 * מעדכנת שורה בסיכום התור: מציגה את הבחירה, או הודעה שעוד לא נבחר
 *
 * @param {string} rowId מזהה השורה בסיכום
 * @param {string} valueId מזהה הערך בשורה
 * @param {string} text הבחירה להצגה
 * @param {string} emptyText ההודעה כשעוד לא נבחר
 */
function setSummary(rowId, valueId, text, emptyText) {
    const value = $(valueId)
    value.textContent = text || emptyText
    value.classList.toggle('is-empty', !text)
    $(rowId).classList.toggle('is-set', Boolean(text))
}

/**
 * מה היא עושה: מסנכרנת את כל המסך עם המצב
 * מחליטה איזה שלב פתוח, מעדכנת את הסיכום, ורק כשהכול נבחר ויש התחברות מאפשרת את כפתור הקביעה
 * נקראת אחרי כל שינוי של המטופלת
 */
function sync() {
    const { doctor, date, time, type } = state
    const authed = hasToken()

    setStep('stepDoctor', { locked: !authed, done: Boolean(doctor), active: authed && !doctor })
    setStep('stepDate', { locked: !authed || !doctor, done: Boolean(date), active: Boolean(doctor) && !date })
    setStep('stepTime', { locked: !authed || !date, done: Boolean(time), active: Boolean(date) && !time })
    setStep('stepDetails', { locked: !authed || !time, done: Boolean(type), active: Boolean(time) && !type })

    $('dateSub').textContent = doctor ? 'באיזה יום נוח לכם?' : 'קודם בוחרים רופא/ה'
    $('timeSub').textContent = date ? longDate(date) : 'קודם בוחרים יום'

    setSummary('rowDoctor', 'sumDoctor', doctor && `ד״ר ${doctor.name}`, 'לא נבחר')
    setSummary('rowDate', 'sumDate', date && longDate(date), 'לא נבחר')
    setSummary('rowTime', 'sumTime', time, 'לא נבחרה')
    setSummary('rowType', 'sumType', type, 'לא נבחר')

    const complete = Boolean(doctor && date && time && type)
    $('bookBtn').disabled = !complete || state.booking || !authed
    $('bookHint').textContent = !authed ? 'צריך להתחבר כדי לקבוע תור'
        : complete ? 'לחיצה אחת, והתור שלכם שמור'
            : !doctor ? 'השלב הבא: בחירת רופא/ה'
                : !date ? 'השלב הבא: בחירת יום'
                    : !time ? 'השלב הבא: בחירת שעה'
                        : 'השלב האחרון: סוג הטיפול'
}

/**
 * מציגה הודעה כללית למעלה, למשל שצריך להתחבר
 *
 * @param {string} message ההודעה להצגה
 */
function showNotice(message) {
    $('authNoticeText').textContent = message
    $('authNotice').hidden = false
}

/**
 * מציגה הודעת שגיאה של הקביעה, ומסתירה אותה כשהטקסט ריק
 *
 * @param {string} message הודעת השגיאה, ריקה כדי להסתיר
 */
function showBookError(message) {
    $('bookErrorText').textContent = message
    $('bookError').hidden = !message
}

/**
 * מה היא עושה: בונה את כרטיסי הרופאים לבחירה
 * לכל כרטיס שם, התמחות, שעות עבודה ויום חופש
 * לחיצה על כרטיס בוחרת את הרופא
 */
function renderDoctors() {
    const grid = $('doctorGrid')
    grid.replaceChildren()

    if (state.doctors.length === 0) {
        const empty = el('div', 'empty-state')
        empty.append(el('i', 'bi bi-person-x'), el('span', '', 'אין רופאים זמינים כרגע'))
        grid.append(empty)
        return
    }

    state.doctors.forEach((doctor) => {
        const card = el('button', 'doctor-card')
        card.type = 'button'
        card.setAttribute('aria-pressed', String(state.doctor?._id === doctor._id))

        const text = el('span')
        text.append(el('span', 'doctor-name', `ד״ר ${doctor.name}`))
        const hours = doctor.workStartTime && doctor.workEndTime ? `${doctor.workStartTime}–${doctor.workEndTime}` : ''
        text.append(el('span', 'doctor-meta', [doctor.specialty || 'רופא/ה', hours].filter(Boolean).join(' · ')))
        if (doctor.dayOff) text.append(el('span', 'doctor-tag', `יום חופש: ${WEEKDAYS_HE[doctor.dayOff] || doctor.dayOff}`))

        const check = el('i', 'bi bi-check-circle-fill doctor-check')
        check.setAttribute('aria-hidden', 'true')

        card.append(el('span', 'avatar', initials(doctor.name)), text, check)
        card.addEventListener('click', () => selectDoctor(doctor))
        grid.append(card)
    })
}

/**
 * מה היא עושה: בוחרת רופא, ומאפסת את היום והשעה שנבחרו קודם
 * אחר כך מציירת מחדש את לוח השנה, כי ימי החופש שונים מרופא לרופא
 *
 * @param {Object} doctor הרופא שנבחר
 */
function selectDoctor(doctor) {
    if (state.doctor?._id === doctor._id) return
    state.doctor = doctor
    state.date = null
    state.time = null
    showBookError('')
    renderDoctors()
    renderCalendar()
    renderSlotsPlaceholder()
    sync()
    $('stepDate').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

/**
 * מה היא עושה: בודקת אם אפשר לקבוע תור ביום מסוים
 * לא אפשרי: היום ובעבר, יותר מהמגבלה קדימה, שבת, ויום החופש של הרופא שנבחר
 * זה אותם כללים שהשרת בודק, כדי שהמטופלת לא תבחר יום שיידחה
 *
 * @param {Date} day היום שבודקים
 * @returns {Object} אובייקט עם סימון אם אפשר, ואם לא אפשר גם הסבר למה
 */
function isDayAvailable(day) {
    const today = startOfToday()
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    const limit = new Date(today); limit.setDate(limit.getDate() + MAX_DAYS_AHEAD)
    const name = WEEKDAYS[day.getDay()]
    if (day < tomorrow || day > limit) return { ok: false }
    if (name === 'Saturday') return { ok: false, off: true, reason: 'שבת' }
    if (state.doctor?.dayOff === name) return { ok: false, off: true, reason: 'יום חופש של הרופא/ה' }
    return { ok: true }
}

/**
 * מה היא עושה: מציירת את לוח השנה של החודש שמוצג
 * כל יום הוא כפתור, והימים שלא אפשריים נעולים
 * וגם נועלת את החצים כשאי אפשר לעבור לחודש קודם או הבא
 */
function renderCalendar() {
    const grid = $('calGrid')
    grid.replaceChildren()

    const month = state.month
    $('calTitle').textContent = month.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })

        ;['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].forEach((letter) => {
            const head = el('div', 'cal-dow', letter)
            head.setAttribute('aria-hidden', 'true')
            grid.append(head)
        })

    for (let i = 0; i < month.getDay(); i++) grid.append(el('div', 'cal-empty'))

    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const today = dateKey(startOfToday())

    for (let n = 1; n <= daysInMonth; n++) {
        const day = new Date(month.getFullYear(), month.getMonth(), n)
        const key = dateKey(day)
        const info = isDayAvailable(day)

        const button = el('button', 'cal-day', String(n))
        button.type = 'button'
        button.setAttribute('aria-label', day.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }))
        if (key === today) button.classList.add('is-today')
        if (key === state.date) { button.classList.add('is-selected'); button.setAttribute('aria-pressed', 'true') }
        if (info.off) { button.classList.add('is-dayoff'); button.title = info.reason }
        button.disabled = !info.ok
        button.addEventListener('click', () => selectDate(key))
        grid.append(button)
    }

    const first = new Date(); first.setDate(1); first.setHours(0, 0, 0, 0)
    const lastAllowed = new Date(); lastAllowed.setDate(lastAllowed.getDate() + MAX_DAYS_AHEAD)
    $('calPrev').disabled = month <= first
    $('calNext').disabled = new Date(month.getFullYear(), month.getMonth() + 1, 1) > lastAllowed
}

/**
 * עוברת לחודש הקודם או הבא ומציירת את הלוח מחדש
 *
 * @param {number} delta מינוס אחד לחודש הקודם, ואחד לחודש הבא
 */
function changeMonth(delta) {
    state.month = new Date(state.month.getFullYear(), state.month.getMonth() + delta, 1)
    renderCalendar()
}

/**
 * מה היא עושה: בוחרת יום, ואז מביאה מהשרת את השעות התפוסות שלו
 * GET /api/appointments/availability?doctorId=...&date=...
 *
 * @param {string} key היום שנבחר כטקסט של שנה חודש ויום
 * @returns {Promise<void>} לא מחזירה ערך
 */
async function selectDate(key) {
    state.date = key
    state.time = null
    showBookError('')
    renderCalendar()
    sync()
    await loadSlots()
    $('stepTime').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

/**
 * מציגה הודעה לפני שנבחר יום: בחרו יום כדי לראות שעות
 */
function renderSlotsPlaceholder() {
    const empty = el('div', 'empty-state')
    empty.append(el('i', 'bi bi-calendar3'), el('span', '', 'בחרו יום כדי לראות שעות פנויות'))
    $('slotsArea').replaceChildren(empty)
}

/**
 * מה היא עושה: שולפת מהשרת את השעות התפוסות של היום שנבחר, ואז מציגה את השעות
 * בזמן הטעינה מוצג מצב המתנה, ואם הפנייה נכשלה מוצגת הודעה וכפתור לנסות שוב
 * GET /api/appointments/availability?doctorId=...&date=...
 *
 * @returns {Promise<void>} לא מחזירה ערך
 */
async function loadSlots() {
    const area = $('slotsArea')
    area.replaceChildren(el('div', 'skeleton'))

    try {
        state.taken = await getAvailability(state.doctor._id, state.date)
    } catch (error) {
        const box = el('div', 'empty-state')
        box.append(el('i', 'bi bi-wifi-off'), el('span', '', error.message))
        const retry = el('button', 'btn btn-outline-primary btn-sm mt-3', 'נסו שוב')
        retry.type = 'button'
        retry.addEventListener('click', loadSlots)
        box.append(retry)
        area.replaceChildren(box)
        return
    }
    renderSlots()
}

/**
 * מה היא עושה: מחשבת את כל השעות של היום שנבחר
 * מתחילה משעת ההתחלה של הרופא וקופצת לפי אורך תור, עד שעת הסיום
 * מדלגת על שעות הפסקה, ומסמנת כתפוסות את השעות שהשרת דיווח עליהן
 *
 * @returns {Array} רשימת השעות של היום, ולכל שעה סימון אם היא תפוסה
 */
function buildSlots() {
    const { doctor, date, taken } = state
    const step = Math.max(5, Number(doctor.appointmentDuration) || 15)
    const start = toMinutes(doctor.workStartTime || '08:00')
    const end = toMinutes(doctor.workEndTime || '17:00')
    const breaks = (doctor.breaks || []).map(b => [toMinutes(b.startTime), toMinutes(b.endTime)])

    const now = new Date()
    const isToday = date === dateKey(now)
    const nowMinutes = now.getHours() * 60 + now.getMinutes()

    const slots = []
    for (let t = start; t < end; t += step) {
        if (breaks.some(([from, to]) => t >= from && t < to)) continue
        if (isToday && t <= nowMinutes) continue
        const time = toHHMM(t)
        slots.push({ time, minutes: t, taken: taken.includes(time) })
    }
    return slots
}

/**
 * מה היא עושה: מציירת את השעות בשתי קבוצות, בוקר וצהריים
 * שעה תפוסה נעולה, ואם אין אף שעה פנויה מוצגת הודעה
 */
function renderSlots() {
    const area = $('slotsArea')
    const slots = buildSlots()
    const free = slots.filter(s => !s.taken).length

    if (free === 0) {
        const empty = el('div', 'empty-state')
        empty.append(el('i', 'bi bi-emoji-frown'), el('span', '', 'אין שעות פנויות ביום הזה. נסו יום אחר.'))
        area.replaceChildren(empty)
        return
    }

    const groups = [
        { title: 'בוקר', icon: 'bi-brightness-high', slots: slots.filter(s => s.minutes < 12 * 60) },
        { title: 'צהריים ואחר הצהריים', icon: 'bi-sunset', slots: slots.filter(s => s.minutes >= 12 * 60) }
    ].filter(g => g.slots.length > 0)

    const wrapper = document.createDocumentFragment()
    groups.forEach((group) => {
        const section = el('div', 'slot-group')
        const title = el('h4', 'slot-group-title')
        title.append(el('i', `bi ${group.icon}`), document.createTextNode(group.title))
        const grid = el('div', 'slot-grid')

        group.slots.forEach((slot) => {
            const button = el('button', 'slot', slot.time)
            button.type = 'button'
            button.disabled = slot.taken
            if (slot.taken) button.title = 'השעה תפוסה'
            if (slot.time === state.time) { button.classList.add('is-selected'); button.setAttribute('aria-pressed', 'true') }
            button.addEventListener('click', () => selectTime(slot.time))
            grid.append(button)
        })
        section.append(title, grid)
        wrapper.append(section)
    })
    area.replaceChildren(wrapper)
}

/**
 * בוחרת שעה, ומעבירה את המטופלת לשלב הבא
 *
 * @param {string} time השעה שנבחרה
 */
function selectTime(time) {
    state.time = time
    showBookError('')
    renderSlots()
    sync()
    $('stepDetails').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

/**
 * מה היא עושה: קובעת את התור בשרת, כשהמטופלת לוחצת על כפתור הקביעה
 * שולחת רופא, יום, שעה, סוג טיפול ובקשה לתזכורת
 * בהצלחה מציגה מסך אישור
 * אם השרת דחה כי ההתחברות פגה, מציגה הודעה להתחבר מחדש
 * אם השעה נתפסה בינתיים, טוענת את השעות מחדש כדי שהמטופלת תבחר אחרת
 * POST /api/appointments
 *
 * @returns {Promise<void>} לא מחזירה ערך
 */
async function onBook() {
    state.booking = true
    const button = $('bookBtn')
    button.replaceChildren(el('span', 'spinner-border me-2'), document.createTextNode(' קובע תור...'))
    showBookError('')
    sync()

    try {
        await bookAppointment({
            doctorId: state.doctor._id,
            date: state.date,
            time: state.time,
            treatmentType: state.type,
            wantsReminder: $('wantsReminder').checked
        })
        showSuccess()
    } catch (error) {
        if (error.status === 401) {
            showNotice('פג תוקף ההתחברות. התחברו מחדש כדי להמשיך.')
        } else if (error.status === 409) {
            state.time = null
            await loadSlots()
        }
        showBookError(error instanceof TypeError ? 'שגיאת תקשורת. ודאו שהשרת פועל ונסו שוב.' : error.message)
    } finally {
        state.booking = false
        button.textContent = 'אישור וקביעת תור'
        sync()
    }
}

/**
 * מציגה את מסך האישור עם פרטי התור שנקבע
 */
function showSuccess() {
    $('okDoctor').textContent = `ד״ר ${state.doctor.name}`
    $('okDate').textContent = longDate(state.date)
    $('okTime').textContent = state.time
    $('okType').textContent = state.type
    $('okReminder').textContent = $('wantsReminder').checked ? 'כן, יום לפני' : 'לא'
    $('bookingView').hidden = true
    $('successView').hidden = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
    $('successTitle').setAttribute('tabindex', '-1')
    $('successTitle').focus({ preventScroll: true })
}

/**
 * מאפסת את כל הבחירות וחוזרת להתחלה, כדי לקבוע עוד תור
 */
function resetBooking() {
    state.doctor = null
    state.date = null
    state.time = null
    state.type = ''
    state.taken = []
    document.querySelectorAll('input[name="treatmentType"]').forEach(r => { r.checked = false })
    $('wantsReminder').checked = false
    showBookError('')
    $('successView').hidden = true
    $('bookingView').hidden = false
    renderDoctors()
    renderCalendar()
    renderSlotsPlaceholder()
    sync()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * מה היא עושה: מה שקורה כשהדף נפתח
 * מחברת את הכפתורים, מציירת את הלוח, ובודקת אם המטופלת מחוברת
 * אם כן, שולפת את רשימת הרופאים מהשרת ומציגה אותם
 * GET /api/doctors
 *
 * @returns {Promise<void>} לא מחזירה ערך
 */
async function init() {
    const first = new Date(); first.setDate(1); first.setHours(0, 0, 0, 0)
    state.month = first

    document.querySelectorAll('input[name="treatmentType"]').forEach((radio) => {
        radio.addEventListener('change', () => { state.type = radio.value; showBookError(''); sync() })
    })
    $('calPrev').addEventListener('click', () => changeMonth(-1))
    $('calNext').addEventListener('click', () => changeMonth(1))
    $('bookBtn').addEventListener('click', onBook)
    $('againBtn').addEventListener('click', resetBooking)

    renderCalendar()
    renderSlotsPlaceholder()

    if (!hasToken()) {
        showNotice('התחברו לחשבון המטופל/ת שלכם כדי להמשיך.')
        $('doctorGrid').replaceChildren()
        sync()
        return
    }

    sync()
    try {
        state.doctors = await getDoctors()
    } catch (error) {
        state.doctors = []
        showNotice(error instanceof TypeError ? 'שגיאת תקשורת. ודאו שהשרת פועל.' : error.message)
    }
    renderDoctors()
    sync()
}

// מפעילים את הפתיחה כשהדף נטען
init()
