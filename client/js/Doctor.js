// const printBtn = document.getElementById('print-btn')
// printBtn.addEventListener('click', () => window.print())

// אם נשמר שם משתמש בהתחברות, מציגים אותו. אם לא, נשאר "שלום, ד״ר"
const savedName = localStorage.getItem('userName')
if (savedName) {
    console.log(localStorage.getItem('userName'))
    document.querySelector('.user-chip').textContent = `שלום, ד״ר ${savedName}`
}