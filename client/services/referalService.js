/**
 * referalService.js: שכבת השירות של ההפניות בצד הלקוח.
 * כאן, ורק כאן, מתבצעות הקריאות לשרת (fetch) על הפניות. קוד הדפים (createReferal.js, myReferals.js)
 * קורא לפונקציות האלה, ולא מדבר עם השרת ישירות.
 *
 * הטוקן נכנס לכאן: authHeaders() קוראת אותו מ-localStorage (נשמר שם בהתחברות, ב-login.js)
 * ושולחת אותו בכל בקשה בכותרת Authorization. בשרת, ה-middleware auth בודק אותו.
 *
 * פונקציות:
 *   getReferalsByPatient(patientId)  GET  /api/patients/:id/referals   ההפניות של מטופל/ת
 *   markReferalAsRead(id)            PUT  /api/referals/:id            סימון הפניה כנקראה
 *   createReferal(formData)          POST /api/referals                יצירת הפניה (רופא/ה)
 *
 * כל פונקציה זורקת Error עם ההודעה שהשרת שלח, ועם error.status (קוד ה-HTTP), אם הבקשה נכשלה.
 */
import { API_URL, TOKEN_KEY } from "./config.js";

/**
 * בונה את כותרת האימות לכל בקשה: Authorization: Bearer <הטוקן>.
 * הטוקן נשלף מ-localStorage בכל קריאה (ולא נשמר במשתנה), כך שהוא תמיד העדכני.
 * @returns {{Authorization: string}}
 */
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` })

/**
 * הופכת תשובת שגיאה של השרת לאובייקט Error.
 * ההודעה היא data.message (הצורה הישנה) או data.error.message (ה-error middleware),
 * ואם אין, הודעת ברירת המחדל. error.status נשמר כדי שהדף יוכל להבחין בין 401 (טוקן פג) לשאר.
 * @param {Response} response תשובת ה-fetch הכושלת
 * @param {string} fallback הודעה למקרה שהשרת לא שלח הודעה
 * @returns {Promise<Error>}
 */
const readError = async (response, fallback) => {
    const data = await response.json().catch(() => ({}))
    const error = new Error(data.message || data.error?.message || fallback)
    error.status = response.status
    return error
}

/**
 * מביאה את ההפניות של מטופל/ת (עם שם הרופא/ה). השרת מאפשר למטופל/ת לראות רק את ההפניות של עצמם.
 * @param {string} patientId מזהה המשתמש של המטופל/ת (נשמר ב-localStorage בהתחברות)
 * @returns {Promise<Array>} מערך הפניות
 */
export const getReferalsByPatient = async (patientId) => {
    const response = await fetch(`${API_URL}/patients/${patientId}/referals`, { headers: authHeaders() })
    if (!response.ok)
        throw await readError(response, 'שגיאה בשליפת ההפניות')
    return await response.json()
}

/**
 * מסמנת הפניה כנקראה (סטטוס open הופך ל-read). השרת בודק שההפניה שייכת למשתמש המחובר.
 * @param {string} id מזהה ההפניה
 */
export const markReferalAsRead = async (id) => {
    const response = await fetch(`${API_URL}/referals/${id}`, { method: 'PUT', headers: authHeaders() })
    if (!response.ok)
        throw await readError(response, 'שגיאה בעדכון סטטוס')
}

/**
 * שולחת הפניה חדשה (רופא/ה בלבד).
 * הגוף הוא FormData (טופס עם קובץ), ובכוונה אין כאן כותרת Content-Type:
 * הדפדפן מוסיף אותה לבד, יחד עם ה-boundary שמפריד בין החלקים (multipart/form-data).
 * @param {FormData} formData השדות patientTz, kindReferal, description, ואופציונלית attachedFile
 * @returns {Promise<Object>} ההפניה שנוצרה
 */
export const createReferal = async (formData) => {
    const response = await fetch(`${API_URL}/referals`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData
    })
    if (!response.ok)
        throw await readError(response, 'שגיאה בשליחת ההפניה')
    return await response.json()
}