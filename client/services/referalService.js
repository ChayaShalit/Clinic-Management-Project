import { API_URL, TOKEN_KEY } from "./config.js";

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` })

// מחלץ את הודעת השגיאה שהשרת שלח (message או error.message)
const readError = async (response, fallback) => {
    const data = await response.json().catch(() => ({}))
    const error = new Error(data.message || data.error?.message || fallback)
    error.status = response.status
    return error
}

export const getReferalsByPatient = async (patientId) => {
    const response = await fetch(`${API_URL}/patients/${patientId}/referals`, { headers: authHeaders() })
    if (!response.ok)
        throw await readError(response, 'שגיאה בשליפת ההפניות')
    return await response.json()
}

export const markReferalAsRead = async (id) => {
    const response = await fetch(`${API_URL}/referals/${id}`, { method: 'PUT', headers: authHeaders() })
    if (!response.ok)
        throw await readError(response, 'שגיאה בעדכון סטטוס')
}

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
