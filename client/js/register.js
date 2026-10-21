import { registerUser } from '../apiService.js';

const msgEl = document.getElementById('apiMessage');

function showApiMessage(msg, isSuccess) {
    if (!msgEl) return;
    msgEl.textContent = msg;
    msgEl.className = isSuccess ? 'msg-success' : 'msg-error';
    msgEl.style.display = 'block';
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');

    submitBtn.disabled = true;//הופכים את הכפתור ללא זמין

    submitBtn.textContent = 'נרשם...';

    if (msgEl) msgEl.style.display = 'none';// ניקוי כל השדות

    const formData = new FormData(e.target);// אוסף את כל הנתונים שהוזנו לאוביקט אחד
    const registerData = Object.fromEntries(formData);// הופך את האוביקט לאוביקט של שדה וערך 

    try {
        // קריאה לפונקציה המרכזית מהקובץ הראשי (apiService)
        await registerUser(registerData.name,registerData.email,registerData.password,registerData.role);

        // אם הגענו לכאן, סימן שההרשמה הצליחה!
        showApiMessage('ההרשמה בוצעה בהצלחה! מעביר אותך להתחברות...', true);

        setTimeout(() => {
            window.location.href = './pages/login.html';
        }, 500);

    } catch (error) {
        // תפיסת השגיאה (בין אם מהשרת או שגיאת רשת) והצגתה למשתמש
        console.error('Register error:', error);
        showApiMessage(error.message || 'שגיאת תקשורת מול השרת.', false);
    } 
    finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'הירשם';
    }
});