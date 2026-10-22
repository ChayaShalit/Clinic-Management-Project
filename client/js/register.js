import { registerUser } from '../apiService.js';

const msgEl = document.getElementById('apiMessage');

function showApiMessage(msg, isSuccess) {
    if (!msgEl) return;
    msgEl.textContent = msg;
    msgEl.className = isSuccess ? 'msg-success' : 'msg-error';
    msgEl.style.display = 'block';
}

    const role = document.getElementById('role');
    const tzContainer = document.getElementById('tzContainer');
    const tzInput = document.getElementById('tz');
    console.log(`${role}--------${tz}`)

    role.addEventListener('change', function () {
      if (this.value === 'patient') {
        tzContainer.classList.remove('hidden'); // הצג אם נבחר מטופל
        tzInput.required = true;     // הופכים את השדה לחובה רק כשהוא מוצג
      } else {
        tzContainer.classList.add('hidden');    // הסתר לכל בחירה אחרת
        tzInput.required = false;              // מבטלים את ה-required כשהוא מוסתר
        tzInput.value = '';                    // מרוקנים את השדה במידה והוקלד משהו
      }
    });

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
        await registerUser(registerData);

        // אם הגענו לכאן, סימן שההרשמה הצליחה!
        showApiMessage('ההרשמה בוצעה בהצלחה! מעביר אותך להתחברות...', true);

        setTimeout(() => {
            window.location.href = 'login.html';
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