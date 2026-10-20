import {API_URL} from './services/config.js'

export async function loginUser(email, password) {
    try{
        const response = await fetch (`${API_URL}/auth/login`,{
            method: POST,
            //מה ששולחים בגוף הבקשה בפורמט json
            headers: {
                'Content-Type': 'application/json'},
            //ממיר את האוביקט למחרוזת 
            body: 
                JSON.stringify({ email, password })
            ,
        });

        const data = await response.json()

        if (!response.ok){
            throw new Error(data.message || 'שגיאה בהתחברות');
        }

        return data; // מחזיר את הנתונים (כמו ה-JWT) למסך שקרא לפונקציה
    } 
    catch (error) {
        console.error('Login error:', error);
        throw error;
   
    }
} 

export async function registerUser(email,name,password,role){

try{
    const response = await fetch(`${API_URL}/auth/register`,{
        method:POST,
         headers: {
                'Content-Type': 'application/json'},
            body: 
                JSON.stringify({email,name,password,role })
            ,
        });

        const data = await response.json()

        if(!response.ok){
              throw new Error(data.message || 'שגיאה בהתחברות'); 
        }
        return data;
    }
    catch(error){
          console.error('Login error:', error);
        throw error;
    }
}