const patientId = "222222222222222222222222"


const escapeHTML = (str) => {
    const div = document.createElement(`div`)
    div.textContent = str;
    return div.innerHTML
};

const fetchReferals = async () => {
    const response = await fetch(`http://localhost:3000/api/patients/${patientId}/referals`)
    const data = await response.json()
    const container = document.getElementById('referals-list')  
    const html1 = data.map(referal => `
    <div>
    <h3>${escapeHTML(referal.kindReferal)}</h3>
    <p>${escapeHTML(referal.description)}</p>
    </div>
    `).join('');
    container.innerHTML = html1;
   data. filter(referal=>referal.status==='open')
   .forEach(referal => markAsRead(referal._id))
    
   };


const markAsRead= async(id)=>{
   

    try{
         const response = await fetch(`http://localhost:3000/api/referals/${id}`,{method:'PUT'})
        if(!response.ok)
            throw new Error('שגיאה בעדכון סטטוס')

    }
    catch(error){
         console.error(error.message);
        
    }

}
fetchReferals();