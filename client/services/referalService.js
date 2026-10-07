import { API_URL } from "./config";
export const getReferalsByPatient= async(patientId)=>{
    const response= await fetch( `${API_URL}/patients/${patientId}/referals`)
    if(!response.ok)
        throw new Error('שגיאה בשליפת ההפניות')
    return await response.json()
}
