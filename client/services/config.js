const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
export const API_URL = `${SERVER_URL}/api`
export const FILES_URL = `${SERVER_URL}/files`
export const TOKEN_KEY = 'token'
export const UPLOADS_URL= `${SERVER_URL}/uploads`

export const HOME_BY_ROLE = {
    patient: 'patientHome.html',
    doctor: 'doctorHome.html'
};


export const SERVER_URL = isLocal
    ? 'http://localhost:3000'
    : 'https://שם-השירות-שלך.onrender.com'