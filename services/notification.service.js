import transporter from '../utils/mailer.js';

/**
 * מיילים אוטומטיים למטופלים:
 *  1. אישור קביעת תור (כולל קובץ יומן ICS להוספה ביומן)
 *  2. הודעה על הפניה חדשה מהרופא/ה
 *
 * כל הפונקציות כאן לא זורקות שגיאה: אם המייל נכשל, זה נרשם בטרמינל
 * והפעולה המקורית (קביעת התור או יצירת ההפניה) ממשיכה כרגיל.
 *
 * משתני סביבה (ב-.env):
 *   EMAIL_USER, EMAIL_PASS   חשבון Gmail ששולח (סיסמת אפליקציה)
 *   CLIENT_URL               כתובת האתר, למשל http://127.0.0.1:5500 (אופציונלי, בשביל כפתור במייל)
 */

const CLINIC = 'מרפאה דיגיטלית';
const TAGLINE = 'הבריאות שלך בקליק';
const COLORS = { ink: '#0a3d44', teal: '#0f766e', soft: '#e4f6f3', coral: '#d83a55', text: '#1b2236', muted: '#667085', line: '#e4e9f2', tile: '#f2f5f5' };

/* ---------- עזרים ---------- */
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const isMailConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const clientLink = (path) => process.env.CLIENT_URL ? `${process.env.CLIENT_URL.replace(/\/$/, '')}/${path}` : null;

// תאריך בפורמט YYYY-MM-DD (או Date) ליום ותאריך בעברית
const parseDate = (value) => {
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
};
const longDate = (value) => parseDate(value).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/* ---------- קובץ יומן (ICS) ---------- */
const pad = (n) => String(n).padStart(2, '0');
const icsText = (text) => String(text).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');

export const buildIcs = ({ date, time, durationMinutes = 15, summary, description, location = CLINIC }) => {
    const day = parseDate(date);
    const [h, m] = time.split(':').map(Number);
    const start = h * 60 + m;
    const end = start + Math.max(5, Number(durationMinutes) || 15);
    const stamp = (minutes) => `${day.getFullYear()}${pad(day.getMonth() + 1)}${pad(day.getDate())}T${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`;
    const created = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Digital Clinic//HE', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
        `UID:${Date.now()}-${Math.round(Math.random() * 1e6)}@digital-clinic`,
        `DTSTAMP:${created}`,
        `DTSTART:${stamp(start)}`,
        `DTEND:${stamp(end)}`,
        `SUMMARY:${icsText(summary)}`,
        `DESCRIPTION:${icsText(description)}`,
        `LOCATION:${icsText(location)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
};

/* ---------- תבנית מייל אחידה (HTML עם עיצוב מוטמע, מתאים ללקוחות מייל) ---------- */
const buildHtml = ({ preheader, title, greeting, intro, rows, buttonText, buttonUrl, note }) => `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f8f7;font-family:Arial,Helvetica,sans-serif;color:${COLORS.text};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f8f7;padding:24px 12px;" dir="rtl">
<tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid ${COLORS.line};" dir="rtl">
    <tr><td style="background:${COLORS.ink};padding:26px 28px;text-align:right;">
      <div style="font-size:24px;font-weight:bold;color:#ffffff;">${CLINIC}</div>
      <div style="font-size:13px;color:#ff9d8e;margin-top:4px;">${TAGLINE}</div>
    </td></tr>
    <tr><td style="padding:30px 28px 8px;text-align:right;">
      <div style="font-size:15px;color:${COLORS.muted};margin-bottom:6px;">${escapeHtml(greeting)}</div>
      <h1 style="margin:0 0 12px;font-size:26px;line-height:1.25;color:${COLORS.ink};">${escapeHtml(title)}</h1>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#3b4a4d;">${escapeHtml(intro)}</p>
    </td></tr>
    <tr><td style="padding:0 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.tile};border-radius:18px;" dir="rtl">
        ${rows.map(([label, value], i) => `<tr><td style="padding:13px 18px;${i < rows.length - 1 ? `border-bottom:1px solid #e1e8e7;` : ''}text-align:right;">
          <span style="display:block;font-size:12px;color:${COLORS.muted};">${escapeHtml(label)}</span>
          <span style="display:block;font-size:17px;font-weight:bold;color:${COLORS.ink};margin-top:2px;">${escapeHtml(value)}</span>
        </td></tr>`).join('')}
      </table>
    </td></tr>
    ${buttonUrl ? `<tr><td style="padding:24px 28px 4px;text-align:right;">
      <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:${COLORS.coral};color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 30px;border-radius:999px;">${escapeHtml(buttonText)}</a>
    </td></tr>` : ''}
    <tr><td style="padding:22px 28px 28px;text-align:right;">
      <p style="margin:0;font-size:13px;line-height:1.6;color:${COLORS.muted};">${escapeHtml(note)}</p>
    </td></tr>
    <tr><td style="background:${COLORS.soft};padding:16px 28px;text-align:center;font-size:12px;color:${COLORS.teal};">
      ${CLINIC} · טלפון: 03-1234567 · א׳–ה׳ 8:00–18:00
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;

/* ---------- שליחה בטוחה ---------- */
const safeSend = async (mail, label) => {
    if (!mail.to) {
        console.warn(`[מייל] ${label}: אין כתובת מייל ליעד, לא נשלח`);
        return false;
    }
    if (!isMailConfigured()) {
        console.warn(`[מייל] ${label}: EMAIL_USER או EMAIL_PASS לא מוגדרים ב-.env, לא נשלח`);
        return false;
    }
    try {
        await transporter.sendMail({ from: `"${CLINIC}" <${process.env.EMAIL_USER}>`, ...mail });
        return true;
    } catch (error) {
        console.error(`[מייל] ${label}: השליחה נכשלה: ${error.message}`);
        return false;
    }
};

/* ---------- 1. אישור קביעת תור ---------- */
export const sendAppointmentConfirmation = async ({ to, patientName, doctorName, date, time, treatmentType, durationMinutes, wantsReminder }) => {
    const doctorLabel = doctorName ? `ד״ר ${doctorName}` : 'הרופא/ה';
    const when = `${longDate(date)} בשעה ${time}`;
    const rows = [
        ['רופא/ה', doctorLabel],
        ['תאריך', longDate(date)],
        ['שעה', time],
        ['סוג הטיפול', treatmentType || 'לא צוין'],
        ['תזכורת במייל', wantsReminder ? 'כן, נשלח מייל יום לפני התור' : 'לא'],
    ];
    const buttonUrl = clientLink('client/pages/patientHome.html');

    return safeSend({
        to,
        subject: `התור שלך נקבע: ${longDate(date)}, ${time}`,
        text: [
            `שלום ${patientName || ''},`,
            '',
            `התור שלך אצל ${doctorLabel} נקבע ל-${when}.`,
            `סוג הטיפול: ${treatmentType || 'לא צוין'}`,
            wantsReminder ? 'נשלח אליך מייל תזכורת יום לפני התור.' : '',
            '',
            `בברכה,`,
            `${CLINIC}`
        ].filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n'),
        html: buildHtml({
            preheader: `התור שלך אצל ${doctorLabel} נקבע ל-${when}`,
            title: 'התור שלך נקבע בהצלחה',
            greeting: `שלום ${patientName || ''},`,
            intro: `קבענו לך תור אצל ${doctorLabel}. אפשר להוסיף אותו ליומן בעזרת הקובץ המצורף.`,
            rows,
            buttonText: 'לאזור האישי שלי',
            buttonUrl,
            note: 'צריך לבטל או לשנות? אפשר ליצור קשר עם המרפאה בטלפון, ונשמח לעזור. כדאי להגיע כ-10 דקות לפני השעה.'
        }),
        attachments: [{
            filename: 'appointment.ics',
            content: buildIcs({ date, time, durationMinutes, summary: `תור אצל ${doctorLabel}`, description: treatmentType || 'תור במרפאה' }),
            contentType: 'text/calendar; charset=utf-8; method=PUBLISH'
        }]
    }, 'אישור קביעת תור');
};

/* ---------- 2. הפניה חדשה ---------- */
// בכוונה לא נשלחים כאן תוכן ההפניה והקובץ המצורף: מידע רפואי נשאר באזור האישי המוגן
export const sendReferalNotification = async ({ to, patientName, doctorName, kindReferal, hasAttachment }) => {
    const doctorLabel = doctorName ? `ד״ר ${doctorName}` : 'הרופא/ה שלך';
    const rows = [
        ['נשלחה על ידי', doctorLabel],
        ['סוג ההפניה', kindReferal || 'לא צוין'],
        ['קובץ מצורף', hasAttachment ? 'כן, מחכה באזור האישי' : 'ללא'],
    ];
    const buttonUrl = clientLink('client/pages/myReferals.html');

    return safeSend({
        to,
        subject: `הפניה חדשה מ${doctorLabel}`,
        text: [
            `שלום ${patientName || ''},`,
            '',
            `${doctorLabel} שלח/ה לך הפניה חדשה: ${kindReferal || ''}.`,
            'את פרטי ההפניה והמסמכים אפשר לראות באזור האישי באתר.',
            '',
            `בברכה,`,
            `${CLINIC}`
        ].join('\n'),
        html: buildHtml({
            preheader: `${doctorLabel} שלח/ה לך הפניה חדשה: ${kindReferal || ''}`,
            title: 'קיבלת הפניה חדשה',
            greeting: `שלום ${patientName || ''},`,
            intro: `${doctorLabel} שלח/ה לך הפניה חדשה. את הפרטים המלאים והמסמכים אפשר לראות באזור האישי.`,
            rows,
            buttonText: 'לצפייה בהפניה',
            buttonUrl,
            note: 'מטעמי פרטיות, תוכן ההפניה והמסמכים לא נשלחים במייל, ורק באזור האישי המוגן בסיסמה.'
        })
    }, 'הפניה חדשה');
};
