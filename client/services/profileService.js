
import { API_URL,TOKEN_KEY } from "./config.js";


const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` });

//מקבלת בקשה והודעת שגיאה
const parse = async (response, fallback) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok)        
         throw new Error(data.error?.message || `${fallback} (קוד ${response.status})`);
    return data;
};


export async function getUserProfile (){
    console.log(`נכנס לפונרקציה עדכון פרפיל בלקוח ! `)

    return parse( await fetch(`${API_URL}/profile`,{
        method:'GET',
        headers: authHeader()}
    )
    ,'שגיאה בשליפת הפרופיל')
}
    

export async function updateUserProfile (body){

     return parse(await fetch(`${API_URL}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body)
    }), 'שגיאה בעדכון הפרופיל');
}
/

export async function uploadProfileImage (file){
    
    const formData = new FormData();
    formData.append('profileImage', file); 
    
    return parse(await fetch(`${API_URL}/profile/imaeg`, {
        method: 'PUT',
        headers: authHeader(),
        body: formData
    }), 'שגיאה בהעלאת התמונה');
};


