import { getReferalsByPatient, markReferalAsRead } from '../services/referalService.js'
import { FILES_URL } from '../services/config.js'

const patientId = "222222222222222222222222"

const escapeHTML = (str) => {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
}

const fetchReferals = async () => {
    const container = document.getElementById('referals-list')

    try {
        const data = await getReferalsByPatient(patientId)

        if (data.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">אין לך הפניות כרגע</p>'
            return
        }

        container.innerHTML = data.map(referal => `
            <div class="col-12 col-md-6 col-lg-4">
                <article class="card referal-card h-100 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h3 class="h5 mb-0">${escapeHTML(referal.kindReferal)}</h3>
                            ${referal.status === 'open'
                ? '<span class="badge bg-success">חדשה</span>'
                : '<span class="badge bg-secondary">נקראה</span>'}
                        </div>
                        <p class="card-text">${escapeHTML(referal.description)}</p>
                        ${referal.attachedFile
                ? `<a class="btn btn-outline-primary btn-sm" href="${FILES_URL}/${encodeURIComponent(referal.attachedFile)}" target="_blank" rel="noopener">צפייה בקובץ</a>`
                : ''}
                    </div>
                </article>
            </div>
        `).join('')

        data
            .filter(referal => referal.status === 'open')
            .forEach(async (referal) => {
                try {
                    await markReferalAsRead(referal._id)
                } catch (error) {
                    console.error(error.message)
                }
            })
    } catch (error) {
        console.error(error.message)
        container.innerHTML = '<p class="text-center text-danger">שגיאה בטעינת ההפניות</p>'
    }
}

fetchReferals()