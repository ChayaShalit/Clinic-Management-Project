
  import {loginUser} from '../apiService.js'
  import { TOKEN_KEY } from '../services/config.js';
  import {HOME_BY_ROLE} from '../services/config.js'

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
            console.log(`${data}`)

            // שמירת הנתונים ב-localStorage

            localStorage.setItem(TOKEN_KEY, data.token);
            
            localStorage.setItem('userId', data.user.id);
            
            localStorage.setItem('role', data.user.role);

              
            //   localStorage.setItem(TOKEN_KEY, data.token);
            //   localStorage.setItem('userId', data.userId || data.id);
            //   localStorage.setItem('role', data.role);

            showApiMessage('התחברתם בהצלחה!', true);

              setTimeout(() => {
                  window.location.href = HOME_BY_ROLE[data.user.role] || 'login.html'; // מעבר לדף הראשי של לוח השנה
              }, 1000);
            
      } 
      catch (error) {

            console.error('Login error:', error);
            const isNetworkError = error instanceof TypeError;   // השרת כבוי או אין אינטרנט
            showApiMessage(isNetworkError ? 'שגיאת תקשורת מול השרת.' : error.message, false);

      } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'התחבר';
      }
  });

