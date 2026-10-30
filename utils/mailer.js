import nodemailer from 'nodemailer';

/**
 * @fileoverview
 * החיבור לשליחת מיילים. שתי דרכים, והבחירה אוטומטית לפי משתני הסביבה:
 * 1. Brevo דרך HTTPS: כשמוגדר BREVO_API_KEY. מתאים לרנדר בתוכנית החינמית, שחוסמת שליחה דרך SMTP
 * 2. Gmail דרך SMTP: כשלא מוגדר BREVO_API_KEY. מתאים להרצה מקומית
 * שתי הדרכים חושפות את אותה פונקציה, sendMail, ולכן שאר הקוד לא יודע באיזו דרך שולחים
 */

const gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// שליחה דרך ה-API של Brevo. בקשת HTTPS רגילה, ולכן אין חסימה של פורטים
const brevoTransporter = {
    async sendMail({ to, subject, text, html }) {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json',
                accept: 'application/json'
            },
            body: JSON.stringify({
                sender: { name: 'מרפאה דיגיטלית', email: process.env.EMAIL_USER },
                to: [{ email: to }],
                subject,
                htmlContent: html,
                textContent: text
            })
        });

        if (!response.ok) {
            const details = await response.text().catch(() => '');
            throw new Error(`Brevo ${response.status}: ${details}`);
        }
    }
};

// ב-Render מגדירים BREVO_API_KEY ומקבלים את הדרך הראשונה, ומקומית אין מפתח ושולחים עם Gmail
const transporter = process.env.BREVO_API_KEY ? brevoTransporter : gmailTransporter;

export default transporter;