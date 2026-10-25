/**
 * myReferals.js: הקוד של הדף "ההפניות שלי" (myReferals.html), למטופל/ת.
 *
 * מה הקובץ עושה:
 *   1. מביא מהשרת את ההפניות של המטופל/ת המחוברים (דרך referalService).
 *   2. מציג כל הפניה בכרטיס: סוג, סטטוס (חדשה או נקראה), שם הרופא/ה, תיאור וקישור לקובץ.
 *   3. מסמן את ההפניות החדשות כנקראו, אחרי שהוצגו.
 *
 * מסלול הבקשה:
 *   myReferals.js -> referalService.js (מוסיף את הטוקן) -> GET /api/patients/:id/referals
 *
 * הטוקן: הקובץ הזה לא נוגע בו ישירות. הוא שולף מ-localStorage רק את userId (נשמר בהתחברות)
 * בשביל הכתובת, והטוקן עצמו נשלח אוטומטית על ידי referalService.
 * ההרשאה האמיתית נבדקת בשרת לפי הטוקן: מטופל/ת לא יכולים לראות הפניות של משתמש אחר.
 */
import { getReferalsByPatient, markReferalAsRead } from '../services/referalService.js'
import { FILES_URL } from '../services/config.js'

// מזהה המשתמש של המטופל/ת. נשמר ב-localStorage בהתחברות (login.js) ומשמש בכתובת הבקשה.
// זה רק "כתובת": מי שמורשה לראות את ההפניות נקבע בשרת לפי הטוקן.
const patientId = localStorage.getItem('userId')

/**
 * מנקה טקסט לפני שמכניסים אותו ל-HTML, כדי למנוע הזרקת קוד (XSS).
 * הדפדפן ממיר לבד תווים כמו < ו-> לגרסה בטוחה כשמשתמשים ב-textContent.
 * @param {string} str טקסט שהגיע מהשרת (סוג, תיאור, שם רופא/ה)
 * @returns {string} טקסט בטוח להכנסה ל-innerHTML
 */
const escapeHTML = (str) => {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
}

/**
 * מביאה את ההפניות, מציגה אותן, ומסמנת את החדשות כנקראו.
 * מצבים: אין הפניות (הודעה), יש הפניות (כרטיסים), או שגיאה (הודעת שגיאה).
 */
const fetchReferals = async () => {
    const container = document.getElementById('referals-list')

    try {
        // הבקשה לשרת. referalService מוסיף את הטוקן, והשרת מחזיר את ההפניות עם שם הרופא/ה (populate)
        const data = await getReferalsByPatient(patientId)

        if (data.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">אין לך הפניות כרגע</p>'
            return
        }

        // בונים כרטיס לכל הפניה. כל טקסט מהשרת עובר דרך escapeHTML, וגם שם הקובץ מקודד לכתובת (encodeURIComponent)
        container.innerHTML = data.map(referal => `
            <div class="col-12 col-md-6 col-lg-4">
                <article class="card referal-card h-100 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h3 class="h5 mb-0">${escapeHTML(referal.kindReferal)}</h3>
                            ${referal.status === 'open'
                ? '<span class="badge bg-success">חדשה</span>'
                : '<span class="badge bg-secondary">נקראה</span>'}
                        </div>
                        <p class="text-muted mb-1">${referal.doctorId?.userId?.name ? 'ד״ר ' + escapeHTML(referal.doctorId.userId.name) : ''}</p>
                        <p class="card-text">${escapeHTML(referal.description)}</p>
                        ${referal.attachedFile
                ? `<a class="btn btn-outline-primary btn-sm" href="${FILES_URL}/${encodeURIComponent(referal.attachedFile)}" target="_blank" rel="noopener">צפייה בקובץ</a>`
                : ''}
                    </div>
                </article>
            </div>
        `).join('')

        // אחרי שההפניות הוצגו: מסמנים את החדשות (open) כנקראו.
        // כל סימון נעשה בנפרד, וכישלון בסימון אחד רק נרשם בלוג ולא מפיל את הדף
        data
            .filter(referal => referal.status === 'open')
            .forEach(async (referal) => {
                try {
                    await markReferalAsRead(referal._id)
                } catch (error) {
                    console.error(error.message)
                }
            })
    } catch (error) {
        // כישלון בטעינה (רשת, טוקן פג, שרת): רושמים בלוג ומציגים הודעה למשתמש
        console.error(error.message)
        container.innerHTML = '<p class="text-center text-danger">שגיאה בטעינת ההפניות</p>'
    }
}

// הפעלה בטעינת הדף
fetchReferals()