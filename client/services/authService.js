import {API_URL} from './config.js'

export async function loginUser(email, password) {
    try{
        const response = await fetch (`${API_URL}/auth/login`,{
            method: 'POST',
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
            throw new Error(data.error?.message || 'שגיאה בהתחברות');
        }
        
        

        return data; // מחזיר את הנתונים (כמו ה-JWT) למסך שקרא לפונקציה
    } 
    catch (error) {
        console.error('Login error:', error);
        throw error;
   
    }
} 

export async function registerUser(registerData) {

try{
    console.log('נכנסת לפונקציה ההרשמה בקובץ הראשי ')
    console.log(API_URL)
    
    const response = await fetch(`${API_URL}/auth/register`,{
        
        method:'POST',
         headers: {
                'Content-Type': 'application/json'},
            body: 
                JSON.stringify(registerData)
            ,
        });   
     console.log('נבנה אוביקט בקשה')

        
        const data = await response.json()
         console.log('אוביקט התפך ל json')


        if(!response.ok){
            throw new Error(data.error?.message || 'שגיאה בהרשמה');
        }


        return data;
    }
    catch(error){
          console.error('Login error:', error);
        throw error;
    }
}