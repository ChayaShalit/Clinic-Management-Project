
  import {loginUser} from '../apiService.js'

  const msgEl = document.getElementById('apiMessage');

  function showApiMessage(msg, isSuccess) {
      msgEl.textContent = msg;
      msgEl.className = isSuccess ? 'msg-success' : 'msg-error';
      msgEl.style.display = 'block';
  }

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'מתחבר...';
      msgEl.style.display = 'none';

      const loginData = {
          email: document.getElementById('email').value,
          password: document.getElementById('password').value
      };

      try {
            const data = await loginUser(loginData.email, loginData.password);
              
            showApiMessage('התחברתם בהצלחה!', true);
              
              // שמירת הנתונים ב-localStorage
              localStorage.setItem('token', data.token);
              localStorage.setItem('userId', data.userId || data.id);
              localStorage.setItem('role', data.role);

              setTimeout(() => {
                  window.location.href = 'index.html'; // מעבר לדף הראשי של לוח השנה
              }, 1000);
            
      } 
      catch (error) {
          console.error('Login error:', error);
          showApiMessage('שגיאת תקשורת מול השרת.', false);
      } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'התחבר';
      }
  });

