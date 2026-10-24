import { API_URL, TOKEN_KEY } from './config.js'

export const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` })

export const hasToken = () => Boolean(localStorage.getItem(TOKEN_KEY))

// מחלץ את הודעת השגיאה שהשרת שלח, ושומר את קוד הסטטוס על השגיאה
export const readError = async (response, fallback) => {
    const data = await response.json().catch(() => ({}))
    const error = new Error(data.message || data.error?.message || fallback)
    error.status = response.status
    return error
}

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

// רשימת הרופאים: שם, התמחות, שעות עבודה, יום חופש והפסקות
export const getDoctors = async () => {
    const response = await fetch(`${API_URL}/doctors`, { headers: authHeaders() })
    if (!response.ok) throw await readError(response, 'לא הצלחנו לטעון את רשימת הרופאים')
    return await response.json()
}

// השעות התפוסות אצל רופא ביום מסוים (date בפורמט YYYY-MM-DD)
export const getAvailability = async (doctorId, date) => {
    const query = new URLSearchParams({ doctorId, date })
    const response = await fetch(`${API_URL}/appointments/availability?${query}`, { headers: authHeaders() })
    if (!response.ok) throw await readError(response, 'לא הצלחנו לבדוק זמינות')
    const data = await response.json()
    return data.taken || []
}

// קביעת תור חדש. המטופלת נקבעת בשרת לפי ההתחברות
export const bookAppointment = async (appointment) => {
    const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(appointment)
    })
    if (!response.ok) throw await readError(response, 'אירעה שגיאה בקביעת התור')
    return await response.json()
}

// ביטול (מחיקת) תור. השרת מוודא שהתור שייך למשתמשת המחוברת
export const cancelAppointment = async (id) => {
    const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
    })
    if (!response.ok) throw await readError(response, 'אירעה שגיאה בביטול התור')
    return await response.json()
}