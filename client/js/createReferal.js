const form=document.getElementById('referal-form')
const message=document.getElementById('message')
form.addEventListener('submit',async(e)=>{
    e.preventDefault()
    const formData=new FormData(form)
    try {
        const response = await fetch('http://localhost:3000/api/referals', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        })
        if (!response.ok) {
            throw new Error('שגיאה בשליחת ההפניה')
        }
        message.textContent = 'ההפניה נשלחה בהצלחה'
        form.reset()
    } catch (error) {
        console.error(error.message)
        message.textContent='נסה שוב '
    }
})