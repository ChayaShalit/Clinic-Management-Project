import { API_URL } from './config.js'

// באיזה מפתח נשמר הטוקן אחרי ההתחברות. לבדוק מול בת 1 שזה אותו שם
const TOKEN_KEY = 'token'

export const getMyAppointments = async () => {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
        throw new Error('NO_TOKEN')
    }

    // הנתיב הזה עוד לא קיים בשרת. מוסיפים אותו בשלב הבא
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
