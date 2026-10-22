import { createReferal } from '../services/referalService.js'
import { TOKEN_KEY } from '../services/config.js'

const $ = (id) => document.getElementById(id)

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MIN_DESCRIPTION = 5

const form = $('referal-form')
const tzInput = $('patientTz')
const descInput = $('description')
const fileInput = $('attachedFile')

let selectedFile = null
let sending = false

/* ---------- עזרים ---------- */
const formatSize = (bytes) => bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

function showFormError(message) {
    $('formErrorText').textContent = message
    $('formError').hidden = !message
}

/* ---------- תעודת זהות ---------- */
function validateTz(showEmptyAsNeutral = true) {
    const value = tzInput.value.trim()
    const wrap = $('tzWrap')
    const status = $('tzStatus')
    const hint = $('tzHint')

    wrap.classList.remove('is-valid', 'is-invalid')
    status.className = 'bi input-status'
    hint.classList.remove('is-error')

    if (value === '' && showEmptyAsNeutral) {
        hint.textContent = 'הזינו תעודת זהות של מטופל/ת שרשום/ה במערכת.'
        return false
    }
    if (/^\d{9}$/.test(value)) {
        wrap.classList.add('is-valid')
        status.classList.add('bi-check-circle-fill')
        hint.textContent = 'תעודת הזהות תקינה.'
        return true
    }
    wrap.classList.add('is-invalid')
    status.classList.add('bi-x-circle-fill')
    hint.classList.add('is-error')
    hint.textContent = /\D/.test(value) ? 'יש להזין ספרות בלבד.' : `יש להזין 9 ספרות (הוזנו ${value.length}).`
    return false
}

tzInput.addEventListener('input', () => {
    tzInput.value = tzInput.value.replace(/\D/g, '').slice(0, 9)
    validateTz()
    showFormError('')
})

/* ---------- תיאור ---------- */
function updateDescription() {
    const length = descInput.value.trim().length
    $('descCount').textContent = `${descInput.value.length} / ${descInput.maxLength}`
    const short = length > 0 && length < MIN_DESCRIPTION
    $('descHint').textContent = short ? `עוד ${MIN_DESCRIPTION - length} תווים לפחות` : 'לפחות 5 תווים'
    $('descHint').classList.toggle('is-error', short)
    return length >= MIN_DESCRIPTION
}
descInput.addEventListener('input', () => { updateDescription(); showFormError('') })

/* ---------- סוג הפניה ---------- */
document.querySelectorAll('input[name="kindReferal"]').forEach((radio) => {
    radio.addEventListener('change', () => showFormError(''))
})

/* ---------- קובץ ---------- */
function clearFile() {
    selectedFile = null
    fileInput.value = ''
    $('fileChip').classList.remove('is-visible')
}

function rejectFile(message) {
    clearFile()
    const error = $('fileError')
    error.textContent = message
    error.hidden = false
}

function setFile(file) {
    $('fileError').hidden = true

    if (!file) return clearFile()
    if (!ALLOWED_TYPES.includes(file.type)) return rejectFile('אפשר לצרף רק קובץ PDF, JPG או PNG.')
    if (file.size > MAX_SIZE) return rejectFile(`הקובץ גדול מדי (${formatSize(file.size)}). המקסימום הוא 5MB.`)

    selectedFile = file
    $('fileName').textContent = file.name
    $('fileSize').textContent = formatSize(file.size)
    $('fileChip').classList.add('is-visible')
}

fileInput.addEventListener('change', () => setFile(fileInput.files[0] || null))
$('fileRemove').addEventListener('click', () => setFile(null))

const dropzone = $('dropzone')
    ;['dragenter', 'dragover'].forEach((type) => dropzone.addEventListener(type, (event) => {
        event.preventDefault()
        dropzone.classList.add('is-dragover')
    }))
    ;['dragleave', 'drop'].forEach((type) => dropzone.addEventListener(type, (event) => {
        event.preventDefault()
        dropzone.classList.remove('is-dragover')
    }))
dropzone.addEventListener('drop', (event) => {
    const file = event.dataTransfer?.files?.[0]
    if (!file) return
    // מעדכנים גם את ה-input עצמו, כדי שהקובץ ייכלל ב-FormData
    const transfer = new DataTransfer()
    transfer.items.add(file)
    fileInput.files = transfer.files
    setFile(file)
})

/* ---------- שליחה ---------- */
form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (sending) return
    showFormError('')

    const tzOk = validateTz(false)
    const kind = form.querySelector('input[name="kindReferal"]:checked')
    const descOk = updateDescription()

    if (!tzOk) { tzInput.focus(); return showFormError('יש להזין תעודת זהות תקינה של 9 ספרות.') }
    if (!kind) { return showFormError('יש לבחור סוג הפניה.') }
    if (!descOk) { descInput.focus(); return showFormError(`התיאור חייב להכיל לפחות ${MIN_DESCRIPTION} תווים.`) }

    if (!localStorage.getItem(TOKEN_KEY)) {
        $('authNotice').hidden = false
        return showFormError('צריך להתחבר כרופא/ה כדי לשלוח הפניה.')
    }

    const formData = new FormData(form)
    if (!selectedFile) formData.delete('attachedFile')

    sending = true
    const button = $('submitBtn')
    button.disabled = true
    const spinner = document.createElement('span')
    spinner.className = 'spinner-border me-2'
    button.replaceChildren(spinner, document.createTextNode(' שולח...'))

    try {
        await createReferal(formData)
        $('okTz').textContent = tzInput.value
        $('okKind').textContent = kind.value
        $('okFile').textContent = selectedFile ? selectedFile.name : 'ללא'
        $('formView').hidden = true
        $('successView').hidden = false
        window.scrollTo({ top: 0, behavior: 'smooth' })
        $('successTitle').setAttribute('tabindex', '-1')
        $('successTitle').focus({ preventScroll: true })
    } catch (error) {
        if (error.status === 401) {
            $('authNotice').hidden = false
            $('authNoticeText').textContent = 'פג תוקף ההתחברות. התחברו מחדש כדי להמשיך.'
        }
        showFormError(error instanceof TypeError ? 'שגיאת תקשורת. ודאו שהשרת פועל ונסו שוב.' : error.message)
    } finally {
        sending = false
        button.disabled = false
        button.textContent = 'שליחת ההפניה'
    }
})

/* ---------- הפניה נוספת ---------- */
$('againBtn').addEventListener('click', () => {
    form.reset()
    setFile(null)
    validateTz()
    updateDescription()
    showFormError('')
    $('successView').hidden = true
    $('formView').hidden = false
    tzInput.focus()
})

if (!localStorage.getItem(TOKEN_KEY)) $('authNotice').hidden = false
updateDescription()
