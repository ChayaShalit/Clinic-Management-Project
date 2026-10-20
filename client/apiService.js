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


        if (!response.ok){
            throw new Error(data.message || 'שגיאה בהתחברות');
        }
        
        const data = await response.json()

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

        if(!response.ok){
              throw new Error(data.message || 'שגיאה בהתחברות'); 
        }

        const data = await response.json()

        return data;
    }
    catch(error){
          console.error('Login error:', error);
        throw error;
    }
}

export async function getUserProfile (role,id,token){
    try{
        const response = await fetch(`${API_URL}/${role}/${id}/`,{
            method:GET,
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
           }
        });
        if(!response.ok){
            throw new Error('שגיאה בשליפת נתוני הפרופיל');
        }
        return await response.json()
    }
    catch(error){
        console.error('Login error:', error);
        throw error;
    }
}

export async function updateUserProfile (role,id,token,objectData){
    try{
        const response = await fetch(`${API_URL}/${role}/${id}`,{
            method:'PUT',
            headers:{'Authorization': `Bearer ${token}`},
            body:objectData
        })
        if(!response.ok){
            throw new Error('שגיאה בעדכון נתוני הפרופיל');
        }
        return await response.json()
            
    }
    catch(error){
        console.error('Login error:', error);
        throw error;
    }
}


