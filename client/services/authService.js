import { TOKEN_KEY, HOME_BY_ROLE } from './config.js';

//מוציאה את הטוקן 
const getPayload = () => {
    try {
        const part = localStorage.getItem(TOKEN_KEY).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(part));
    } catch { return null; }
};

//מחזירה את התפקיד מתוך הטוקן
export const getRole = () => {
    const payload = getPayload();
    if (!payload || payload.exp * 1000 < Date.now()) return null;   // אין טוקן או שפג תוקפו
    return payload.role;
};

//בודקת שאכן המשתמש שרוצה להכנס לדף , רשום והתפקיד שלו מתאים לדף
export const requireAuth = (allowedRoles) => {
    const role = getRole();
    if (!role) { location.href = 'login.html'; return null; }
    if (allowedRoles && !allowedRoles.includes(role)) { location.href = HOME_BY_ROLE[role]; return null; }
    return role;
};

//פונקציה של ניתוק שמחזירה לדף ההתחברות 
export const logout = () => {
    localStorage.clear();
    location.href = 'login.html';
};