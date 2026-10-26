// עיצוב המיילים: תבנית HTML אחת ששני המיילים משתמשים בה.
// העיצוב מוטמע בתוך התגיות (inline), כי לקוחות מייל לא תומכים ב-CSS חיצוני.

// שם המרפאה. מופיע בכותרת המייל, בפס התחתון ובשם השולח
export const CLINIC = 'מרפאה דיגיטלית';
// הסלוגן שמתחת לשם המרפאה בכותרת המייל
const TAGLINE = 'הבריאות שלך בקליק';
// צבעי המייל. נכתבים ישירות בתגיות, כי תוכנות מייל לא תומכות בקובץ עיצוב חיצוני
const COLORS = { ink: '#0a3d44', teal: '#0f766e', soft: '#e4f6f3', text: '#1b2236', muted: '#667085', line: '#e4e9f2', tile: '#f2f5f5' };

/**
 * מה היא עושה: מנקה טקסט לפני שמכניסים אותו ל-HTML
 * מחליפה תווים מסוכנים כמו < ו-> בגרסה בטוחה שמוצגת כטקסט
 * למה צריך: מונעת הזרקת קוד (XSS). שם מטופלת כמו <b>רחל</b> יוצג במייל כטקסט ולא יורץ כקוד
 * ערך ריק הופך למחרוזת ריקה
 *
 * @param {*} value הטקסט לניקוי
 * @returns {string} טקסט בטוח להכנסה ל-HTML
 */
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * מה היא עושה: בונה את המייל המעוצב, כמחרוזת HTML אחת
 * כותרת כהה עם שם המרפאה, ברכה, כותרת, פסקת פתיחה, טבלת פרטים, הערה ופס תחתון
 * כל טקסט שנכנס למייל עובר דרך escapeHtml
 * למה צריך: עיצוב אחד שכל המיילים משתמשים בו, ולכן כולם נראים אותו דבר
 * הפריסה בטבלאות כי זה מה שתוכנות המייל מבינות
 * משמשת את sendMail בשירות המיילים
 *
 * @param {Object} content תוכן המייל
 * @param {string} content.preheader טקסט מוסתר שמוצג כתצוגה מקדימה ברשימת המיילים
 * @param {string} content.title הכותרת הגדולה
 * @param {string} content.greeting הברכה, למשל שלום רחל
 * @param {string} content.intro פסקת הפתיחה
 * @param {Array<Array<string>>} content.rows שורות הטבלה, כל שורה היא כותרת וערך
 * @param {string} content.note ההערה בתחתית
 * @returns {string} המייל כ-HTML מלא
 */
export const buildHtml = ({ preheader, title, greeting, intro, rows, note }) => `<!DOCTYPE html>
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
        ${rows.map(([label, value], i) => `<tr><td style="padding:13px 18px;${i < rows.length - 1 ? 'border-bottom:1px solid #e1e8e7;' : ''}text-align:right;">
          <span style="display:block;font-size:12px;color:${COLORS.muted};">${escapeHtml(label)}</span>
          <span style="display:block;font-size:17px;font-weight:bold;color:${COLORS.ink};margin-top:2px;">${escapeHtml(value)}</span>
        </td></tr>`).join('')}
      </table>
    </td></tr>
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