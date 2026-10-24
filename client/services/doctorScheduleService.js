import { API_URL } from './config.js'
import { authHeaders, readError } from './appointmentService.js'

// פונקציות העזר של הבקשות (טוקן והודעות שגיאה) מוגדרות פעם אחת ב-appointmentService.js
export { hasToken } from './appointmentService.js'

// שעות העבודה של הרופא המחובר
export const getMySchedule = async () => {
    const response = await fetch(`${API_URL}/doctors/me/schedule`, { headers: authHeaders() })
    if (!response.ok) throw await readError(response, 'לא הצלחנו לטעון את שעות העבודה')
    const data = await response.json()
    return data.schedule
}

// שמירת שעות העבודה של הרופא המחובר
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
