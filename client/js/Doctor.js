const printBtn = document.getElementById('print-btn')
printBtn.addEventListener('click', () => window.print())

// אם נשמר שם משתמש בהתחברות, מציגים אותו. אם לא, נשאר "שלום, ד״ר"
const savedName = localStorage.getItem('userName')
if (savedName) {
    document.getElementById('user-chip').textContent = `שלום, ד״ר ${savedName}`
}