
import { API_URL } from "./config";

export async function getUserProfile (role,id,token){
    console.log(`נכנס לפונרקציה עדכון פרפיל בלקוח ! ___________ הטוקן :${token}`)
    try{
        const response = await fetch(`${API_URL}/profile`,{
            method:'GET',
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
        const response = await fetch(`${API_URL}/profile`,{
            method:'PATCH',
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


