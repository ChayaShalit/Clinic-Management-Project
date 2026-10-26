import { API_URL, TOKEN_KEY } from './config.js'

/**
 * @fileoverview
 * שירות התורים בלקוח: כל הפניות של דפי התורים לשרת עוברות מכאן
 * כתובת השרת לא כתובה כאן, אלא מגיעה מקובץ ההגדרות המשותף
 * בכל בקשה נשלח הטוקן שהתקבל בהתחברות, כדי שהשרת יידע מי המשתמשת
 */

/**
 * מה היא עושה: בונה את הכותרת שמעבירה את הטוקן לשרת
 * הטוקן נשמר בדפדפן אחרי ההתחברות, ונשלח בכל בקשה
 *
 * @returns {Object} כותרת בקשה שמכילה את הטוקן
 */
export const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` })

/**
 * מה היא עושה: בודקת אם יש טוקן בדפדפן, כלומר אם המשתמשת התחברה
 * היא לא בודקת שהטוקן תקף, זה תפקיד השרת
 *
 * @returns {boolean} אמת אם יש טוקן בדפדפן
 */
export const hasToken = () => Boolean(localStorage.getItem(TOKEN_KEY))

/**
 * מה היא עושה: קוראת מהתשובה של השרת את הודעת השגיאה
 * השרת מחזיר את ההודעה באחד משני מקומות, ולכן בודקים את שניהם
 * אם אין הודעה, משתמשים בהודעה שנשלחה לפונקציה
 * שומרת על השגיאה גם את קוד המצב, כדי שהדף יוכל להגיב לפי הסוג
 *
 * @param {Object} response התשובה שהתקבלה מהשרת
 * @param {string} fallback הודעה למקרה שהשרת לא שלח הודעה
 * @returns {Promise<Error>} שגיאה עם הודעה וקוד מצב
 */
export const readError = async (response, fallback) => {
    const data = await response.json().catch(() => ({}))
    const error = new Error(data.message || data.error?.message || fallback)
    error.status = response.status
    return error
}

/**
 * מה היא עושה: מביאה מהשרת את התורים של המטופלת המחוברת
 * מי קורא לה: הדף הראשי של המטופלת
 * כשאין טוקן, או כשהשרת דחה אותו, זורקת שגיאה מיוחדת, והדף מציג לפיה הודעה מתאימה
 * הכתובת בשרת
 * GET /api/appointments/my
 *
 * @returns {Promise<Array>} רשימת התורים של המטופלת
 */
export const getMyAppointments = async () => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
        throw new Error('NO_TOKEN')
    }

    const response = await fetch(`${API_URL}/appointments/my`, {
        headers: { Authorization: `Bearer ${token}` }
    })

    if (response.status === 401) {
        throw new Error('UNAUTHORIZED')
    }

    if (!response.ok) {
        throw new Error('שגיאה בטעינת התורים')
    }

    const data = await response.json()
    return data.appointments || []
}

/**
 * מה היא עושה: מביאה את רשימת הרופאים ואת שעות העבודה שלהם
 * מי קורא לה: דף היומן, כשהוא נפתח
 * הכתובת בשרת
 * GET /api/doctors
 *
 * @returns {Promise<Array>} רשימת הרופאים עם שעות העבודה שלהם
 */
export const getDoctors = async () => {
    const response = await fetch(`${API_URL}/doctors`, { headers: authHeaders() })
    if (!response.ok) throw await readError(response, 'לא הצלחנו לטעון את רשימת הרופאים')
    return await response.json()
}

/**
 * מה היא עושה: מביאה את השעות התפוסות אצל רופא ביום מסוים
 * מי קורא לה: דף היומן, אחרי שהמטופלת בוחרת יום
 * הדף מסתיר את השעות התפוסות, כך שנראות רק שעות פנויות
 * הכתובת בשרת
 * GET /api/appointments/availability?doctorId=...&date=...
 *
 * @param {string} doctorId מזהה הרופא
 * @param {string} date התאריך שנבחר
 * @returns {Promise<Array>} רשימת השעות התפוסות
 */
export const getAvailability = async (doctorId, date) => {
    const query = new URLSearchParams({ doctorId, date })
    const response = await fetch(`${API_URL}/appointments/availability?${query}`, { headers: authHeaders() })
    if (!response.ok) throw await readError(response, 'לא הצלחנו לבדוק זמינות')
    const data = await response.json()
    return data.taken || []
}

/**
 * מה היא עושה: שולחת לשרת בקשה לקבוע תור חדש
 * מי קורא לה: דף היומן, בלחיצה על כפתור הקביעה
 * שולחת רופא, תאריך, שעה, סוג טיפול ובקשה לתזכורת
 * המטופלת לא נשלחת, כי השרת מזהה אותה מהטוקן
 * הכתובת בשרת
 * POST /api/appointments
 *
 * @param {Object} appointment פרטי התור: רופא, תאריך, שעה, סוג טיפול ותזכורת
 * @returns {Promise<Object>} תשובת השרת עם התור שנקבע
 */
export const bookAppointment = async (appointment) => {
    const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(appointment)
    })
    if (!response.ok) throw await readError(response, 'אירעה שגיאה בקביעת התור')
    return await response.json()
}

/**
 * מה היא עושה: שולחת לשרת בקשה לבטל תור לפי מזהה
 * מי קורא לה: כפתור ביטול התור בדף הראשי של המטופלת
 * השרת בודק שהתור שייך למי ששלחה את הבקשה
 * הכתובת בשרת
 * DELETE /api/appointments/:id
 *
 * @param {string} id מזהה התור לביטול
 * @returns {Promise<Object>} תשובת השרת עם הודעת הצלחה
 */
export const cancelAppointment = async (id) => {
    const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    })
    if (!response.ok) throw await readError(response, 'אירעה שגיאה בביטול התור')
    return await response.json()
}