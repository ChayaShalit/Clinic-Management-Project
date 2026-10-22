import { getMyAppointments } from '../services/appointmentService.js'

const listEl = document.getElementById('upcoming-list')

// מונע הזרקת קוד אם יש בטקסט מהשרת תווים מיוחדים
const escapeHTML = (str) => {
    const div = document.createElement('div')
    div.textContent = str ?? ''
    return div.innerHTML
}

const showMessage = (text) => {
    listEl.innerHTML = `<p class="text-muted">${escapeHTML(text)}</p>`
}

const formatDate = (isoDate) =>
    new Date(isoDate).toLocaleDateString('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    })

const renderAppointments = (appointments) => {
    if (appointments.length === 0) {
        listEl.innerHTML = `
            <div class="col-12">
                <p class="text-muted mb-2">אין לך תורים קרובים.</p>
                <a href="appointment-calendar.html" class="btn btn-primary">קביעת תור</a>
            </div>`
        return
    }

    listEl.innerHTML = appointments.map(a => `
        <div class="col-md-6 col-lg-4">
            <div class="card shadow-sm h-100">
                <div class="card-body">
                    <h3 class="h6 mb-1">${escapeHTML(formatDate(a.date))}</h3>
                    <p class="fs-4 fw-semibold mb-2">${escapeHTML(a.time)}</p>
                    <p class="mb-1">${escapeHTML(a.doctorId?.name ? 'ד״ר ' + a.doctorId.name : '')}</p>
                    <p class="small text-muted mb-0">${escapeHTML(a.treatmentType || '')}</p>
                </div>
            </div>
        </div>
    `).join('')
}

const loadUpcomingAppointments = async () => {
    try {
        const appointments = await getMyAppointments()

        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)

        const upcoming = appointments
            .filter(a => a.status === 'confirmed' && new Date(a.date) >= startOfToday)
            .sort((a, b) => new Date(a.date) - new Date(b.date) || a.time.localeCompare(b.time))

        renderAppointments(upcoming)
    } catch (error) {
        console.error(error.message)

        if (error.message === 'NO_TOKEN') {
            showMessage('כדי לראות את התורים שלך צריך להתחבר.')
        } else if (error.message === 'UNAUTHORIZED') {
            showMessage('החיבור פג. אפשר להתחבר שוב.')
        } else {
            showMessage('לא הצלחנו לטעון את התורים. אפשר לנסות לרענן את הדף.')
        }
    }
}

// אם נשמר שם משתמש בהתחברות, מציגים אותו. אם לא, נשאר "שלום, מטופלת"
const savedName = localStorage.getItem('userName')
if (savedName) {
    document.getElementById('user-chip').textContent = `שלום, ${savedName}`
}

loadUpcomingAppointments()