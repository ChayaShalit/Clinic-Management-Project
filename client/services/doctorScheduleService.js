import { API_URL, TOKEN_KEY } from './config.js'

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` })

export const hasToken = () => Boolean(localStorage.getItem(TOKEN_KEY))

// מחלץ את הודעת השגיאה שהשרת שלח, ושומר את קוד הסטטוס על השגיאה
const readError = async (response, fallback) => {
    const data = await response.json().catch(() => ({}))
    const error = new Error(data.message || data.error?.message || fallback)
    error.status = response.status
    return error
}

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
