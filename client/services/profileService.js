
import { API_URL,TOKEN_KEY } from "./config.js";


const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` });

//מקבלת בקשה והודעת שגיאה
const parse = async (response, fallback) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error?.message || fallback);
    return data;
};


export async function getUserProfile (){
    console.log(`נכנס לפונרקציה עדכון פרפיל בלקוח ! `)

    parse( await fetch(`${API_URL}/profile`,{
        method:'GET',
        headers: authHeader()}
    )
    ,'שגיאה בשליפת הפרופיל')
}
    
//     const response = await fetch(`${API_URL}/profile`,{
//         method:'GET',
//         headers: {'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`}
//     });

//     const data = await response.json().catch(() => ({}));
    
//     if (!response.ok) {
//         throw new Error(data.error?.message || 'שגיאה בשליפת הפרופיל');
//     }

//     return data;
// }

export async function updateUserProfile (body){

     parse(await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json',  headers: authHeader() },
        body: JSON.stringify(body)
    }), 'שגיאה בעדכון הפרופיל');
}
//         const response = await fetch(`${API_URL}/profile`,{
//             method:'PATCH',
//             headers:{
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${localStorage.getItem(TOKEN_KEY)}`},
//             body:JSON.stringify(body)
//         })
//         const data = await response.json().catch(() => ({}));
    
//     if (!response.ok) {
//         throw new Error(data.error?.message || 'שגיאה בשליפת הפרופיל');
//     }

//     return data;
// }


export async function uploadProfileImage (file){
    
    const formData = new FormData();
    formData.append('profileImage', file); 
    
    return parse(await fetch(`${API_URL}/profile/profileImaeg`, {
        method: 'PUT',
        headers: authHeader(),
        body: formData
    }), 'שגיאה בהעלאת התמונה');
};


//     try{
//         const response = await fetch(`${API_URL}/profile/profileImaeg`,{
//             method:'PUT',
//             headers: {
//             'Authorization': `Bearer ${localStorage.getItem('TOKEN_KEY')}`
//            },
//             body: formData
//         });

//     }

// }


