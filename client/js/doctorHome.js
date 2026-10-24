// דף הרופא בלבד — לא משנה קבצי הפניות או פרופיל.
import { API_URL } from '../services/config.js';

const message = document.getElementById('doctorMessage');
const todayList = document.getElementById('todayList');
const allList = document.getElementById('allList');
const dateInput = document.getElementById('appointmentsDate');

let appointments = [];

function localDateKey(value = new Date()) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function appointmentDateKey(value) {
    if (typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }

    return localDateKey(value);
}

function safe(value) {
    const el = document.createElement('span');
    el.textContent = String(value ?? '');
    return el.innerHTML;
}

function statusText(status) {
    return {
        confirmed: 'מאושר',
        cancelled: 'מבוטל',
        completed: 'הושלם'
    }[status] || 'לא ידוע';
}

function renderCards(target, records) {
    if (!records.length) {
        target.innerHTML =
            '<p class="text-muted">לא נמצאו תורים לתצוגה זו.</p>';
        return;
    }

    target.innerHTML = records.map(item => {
        const patient = item.patientId;

        const patientName =
            patient && typeof patient === 'object'
                ? (patient.userId?.name ||
                   patient.name ||
                   item.patientName ||
                   'מטופל/ת')
                : (item.patientName || 'מטופל/ת');

        return `
            <div class="col-12 col-md-6 col-lg-4">
                <article class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h3 class="h5">
                            ${safe(item.time || 'שעה לא ידועה')}
                            —
                            ${safe(patientName)}
                        </h3>

                        <p class="mb-1">
                            תאריך: ${safe(appointmentDateKey(item.date))}
                        </p>

                        <p class="mb-1">
                            סוג טיפול:
                            ${safe(item.treatmentType || 'לא צוין')}
                        </p>

                        <p class="mb-0">
                            סטטוס: ${safe(statusText(item.status))}
                        </p>
                    </div>
                </article>
            </div>
        `;
    }).join('');
}

function render() {
    const sorted = [...appointments].sort((a, b) =>
        (appointmentDateKey(a.date) + (a.time || ''))
            .localeCompare(
                appointmentDateKey(b.date) + (b.time || '')
            )
    );

    renderCards(
        todayList,
        sorted.filter(
            item => appointmentDateKey(item.date) === localDateKey()
        )
    );

    renderCards(
        allList,
        dateInput.value
            ? sorted.filter(
                item => appointmentDateKey(item.date) === dateInput.value
              )
            : sorted
    );
}

async function loadAppointments() {
    const token = localStorage.getItem('token');

    if (!token) {
        message.className = 'alert alert-warning';
        message.textContent =
            'כדי להציג תורים צריך להתחבר כרופא. אין כרגע טוקן בדפדפן.';

        todayList.replaceChildren();
        allList.replaceChildren();
        return;
    }

    message.className = 'alert alert-info';
    message.textContent = 'טוען תורים...';

    try {
        const response = await fetch(
            `${API_URL}/appointments/doctor/my`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || data.error?.message || 'לא ניתן לטעון תורים'
            );
        }

        appointments = Array.isArray(data.appointments)
            ? data.appointments
            : [];

        render();

        message.className = 'alert alert-success';
        message.textContent = 'רשימת התורים נטענה בהצלחה.';

    } catch (error) {
        message.className = 'alert alert-danger';
        message.textContent = error.message;

        todayList.replaceChildren();
        allList.replaceChildren();
    }
}

dateInput.addEventListener('change', render);

document
    .getElementById('showAllAppointments')
    .addEventListener('click', () => {
        dateInput.value = '';
        render();
    });

document
    .getElementById('refreshAppointments')
    .addEventListener('click', loadAppointments);

loadAppointments();
document.getElementById('downloadTodayPDF')
    .addEventListener('click', async () => {
        const button = document.getElementById('downloadTodayPDF');
        const token = localStorage.getItem('token');

        if (!token) {
            alert('צריך להתחבר כרופא כדי להוריד תורים');
            return;
        }

        button.disabled = true;

        try {
            const response = await fetch(
                `${API_URL}/appointments/doctor/my/today/pdf`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('הורדת PDF נכשלה');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'today-appointments.pdf';
            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);

        } catch (error) {
            console.error(error);
            alert('לא הצלחנו להוריד את הקובץ');
        } finally {
            button.disabled = false;
        }
    });