import { getMyAppointments, cancelAppointment } from '../services/appointmentService.js'
/**
 * @fileoverview
 * הדף הראשי של המטופלת: התורים הקרובים שלה ואפשרות לבטל
 * הדף מדבר עם השרת בשני מקרים: טעינת התורים, וביטול תור
 * שתי הפניות עוברות דרך קובץ השירות של התורים
 * GET /api/appointments/my
 * DELETE /api/appointments/:id
 */

const listEl = document.getElementById('upcoming-list')

/**
 * מה היא עושה: מנקה טקסט לפני שמציגים אותו בדף
 * כך תווים מיוחדים בטקסט שהגיע מהשרת לא יוכלו להפעיל קוד זדוני
 *
 * @param {string} str הטקסט להצגה
 * @returns {string} הטקסט אחרי ניקוי תווים מיוחדים
 */
const escapeHTML = (str) => {
    const div = document.createElement('div')
    div.textContent = str ?? ''
    return div.innerHTML
}

/**
 * מציגה הודעה פשוטה במקום רשימת התורים
 *
 * @param {string} text ההודעה להצגה
 */
const showMessage = (text) => {
    listEl.innerHTML = `<p class="text-muted">${escapeHTML(text)}</p>`
}

/**
 * הופכת תאריך מהשרת לתאריך בעברית עם שם היום
 *
 * @param {string} isoDate התאריך כפי שהגיע מהשרת
 * @returns {string} תאריך בעברית עם שם היום
 */
const formatDate = (isoDate) =>
    new Date(isoDate).toLocaleDateString('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    })

/**
 * מה היא עושה: בונה את כרטיסי התורים הקרובים
 * אם אין תורים, מציגה הודעה וכפתור לקביעת תור
 * לכל כרטיס יש כפתור ביטול שמחזיק את מזהה התור
 *
 * @param {Array} appointments התורים הקרובים להצגה
 */
const renderAppointments = (appointments) => {
    if (appointments.length === 0) {
        listEl.innerHTML = `
            <div class="col-12">
                <p class="text-muted mb-2">אין לך תורים קרובים.</p>
                <a href="appointment-calendar.html" class="btn btn-primary">קביעת תור</a>
            </div>`
        return
    }

    listEl.innerHTML = appointments.map(a => `
        <div class="col-md-6 col-lg-4">
            <div class="card shadow-sm h-100">
                <div class="card-body">
                    <h3 class="h6 mb-1">${escapeHTML(formatDate(a.date))}</h3>
                    <p class="fs-4 fw-semibold mb-2">${escapeHTML(a.time)}</p>
                    <p class="mb-1">${escapeHTML(a.doctorId?.userId?.name? 'ד״ר ' + a.doctorId.userId.name : '')}</p>
                    <p class="small text-muted mb-0">${escapeHTML(a.treatmentType || '')}</p>
                    <button type="button" class="btn btn-outline-danger btn-sm mt-3 cancel-btn" data-id="${escapeHTML(a._id)}">ביטול תור</button>
                </div>
            </div>
        </div>
    `).join('')
}

/**
 * מה היא עושה: מביאה מהשרת את תורי המטופלת ומציגה רק את הקרובים
 * קרוב אומר מאושר ובתאריך של היום או אחריו, ממוין מהמוקדם למאוחר
 * כל סוג שגיאה מציג הודעה מתאימה: אין התחברות, התחברות שפגה, או תקלה כללית
 * GET /api/appointments/my
 *
 * @returns {Promise<void>} לא מחזירה ערך
 */
const loadUpcomingAppointments = async () => {
    try {
        const appointments = await getMyAppointments()

        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)

        const upcoming = appointments
            .filter(a => a.status === 'confirmed' && new Date(a.date) >= startOfToday)
            .sort((a, b) => new Date(a.date) - new Date(b.date) || a.time.localeCompare(b.time))

        renderAppointments(upcoming)
    } catch (error) {
        console.error(error.message)

        if (error.message === 'NO_TOKEN') {
            showMessage('כדי לראות את התורים שלך צריך להתחבר.')
        } else if (error.message === 'UNAUTHORIZED') {
            showMessage('החיבור פג. אפשר להתחבר שוב.')
        } else {
            showMessage('לא הצלחנו לטעון את התורים. אפשר לנסות לרענן את הדף.')
        }
    }
}

// אם שם המשתמשת נשמר בהתחברות, מציגים אותו בברכה בראש הדף
const savedName = localStorage.getItem('userName')
if (savedName) {
    document.getElementById('user-chip').textContent = `שלום, ${savedName}`
}

   // מה קורה בלחיצה על כפתור ביטול
   // שואלים לאישור, שולחים את הבקשה לשרת, ואז טוענים את הרשימה מחדש
   // ההרשאה נבדקת בשרת, והשגיאה שלו מוצגת אם נכשל
   // DELETE /api/appointments/:id
   listEl.addEventListener('click', async (e) => {
       const button = e.target.closest('.cancel-btn')
       if (!button) return

       if (!confirm('לבטל את התור?')) return

       button.disabled = true

       try {
           await cancelAppointment(button.dataset.id)
           await loadUpcomingAppointments()
       } catch (error) {
           console.error(error.message)
           button.disabled = false
           alert(error.message)
       }
   })
// טעינה ראשונה של התורים כשהדף נפתח
loadUpcomingAppointments()