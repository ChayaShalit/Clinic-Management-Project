import { API_URL } from './config.js'
import { authHeaders, readError } from './appointmentService.js'

/**
 * @fileoverview
 * שירות שעות העבודה של הרופא: שתי פניות לשרת
 * משתמש באותם כלים של שירות התורים, כדי לא לחזור על אותו קוד
 */

// מועבר הלאה משירות התורים, כדי שהדף ייבא הכול ממקום אחד
export { hasToken } from './appointmentService.js'

/**
 * מה היא עושה: מביאה מהשרת את שעות העבודה של הרופא המחובר
 * מי קורא לה: דף שעות העבודה, כשהוא נפתח
 * הכתובת בשרת
 * GET /api/doctors/me/schedule
 *
 * @returns {Promise<Object>} שעות העבודה של הרופא
 */
export const getMySchedule = async () => {
    const response = await fetch(`${API_URL}/doctors/me/schedule`, { headers: authHeaders() })
    if (!response.ok) throw await readError(response, 'לא הצלחנו לטעון את שעות העבודה')
    const data = await response.json()
    return data.schedule
}

/**
 * מה היא עושה: שולחת לשרת את שעות העבודה החדשות לשמירה
 * מי קורא לה: דף שעות העבודה, כשהרופא לוחץ על שמירה
 * מה חוזר: השעות כפי שהשרת שמר אותן
 * הכתובת בשרת
 * PUT /api/doctors/me/schedule
 *
 * @param {Object} schedule שעות העבודה החדשות
 * @returns {Promise<Object>} השעות כפי שהשרת שמר
 */
export const saveMySchedule = async (schedule) => {
    const response = await fetch(`${API_URL}/doctors/me/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(schedule)
    })
    if (!response.ok) throw await readError(response, 'אירעה שגיאה בשמירת שעות העבודה')
    const data = await response.json()
    return data.schedule
}
