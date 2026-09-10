import { Lead } from '../types'

export function exportCSV(leads: Lead[]) {
  const headers = [
    'ID', 'Name', 'Email', 'Phone', 'Score', 'Service', 'Consultation',
    'Pipeline Stage', 'Credit Score', 'Requested Funding', 'Payment Status',
    'Appointment', 'Created',
  ]
  const rows = leads.map((l) => [
    l.id, l.client_info.full_name, l.client_info.email, l.client_info.phone_number,
    l.lead_classification, l.primary_service, l.consultation_type,
    l.pipeline_stage, l.credit_score ?? '', l.requested_funding ?? '',
    l.payment_status, l.appointment_scheduled ? 'Yes' : 'No', new Date(l.created_at).toLocaleString(),
  ])
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, 'ncr-group-leads.csv')
}

export async function exportExcel(leads: Lead[]) {
  const XLSX = await import('xlsx')
  const data = leads.map((l) => ({
    ID: l.id, Name: l.client_info.full_name, Email: l.client_info.email,
    Phone: l.client_info.phone_number, Score: l.lead_classification,
    Service: l.primary_service, Consultation: l.consultation_type,
    Stage: l.pipeline_stage, Credit: l.credit_score ?? '',
    Requested: l.requested_funding ?? '', Payment: l.payment_status,
    Appointment: l.appointment_scheduled ? 'Yes' : 'No',
    Created: new Date(l.created_at).toLocaleString(),
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Leads')
  XLSX.writeFile(wb, 'ncr-group-leads.xlsx')
}

export async function exportPDF(leads: Lead[]) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('NCR Group — Lead Report', 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Generated ${new Date().toLocaleString()} · ${leads.length} leads`, 14, 22)
  doc.setTextColor(40)
  let y = 30
  leads.forEach((l) => {
    if (y > 280) { doc.addPage(); y = 20 }
    doc.setFontSize(10); doc.setTextColor(20)
    doc.text(`${l.client_info.full_name} (${l.id})`, 14, y)
    doc.setFontSize(8.5); doc.setTextColor(110)
    doc.text(`${l.lead_classification} · ${l.primary_service} · ${l.pipeline_stage} · ${l.payment_status}`, 14, y + 5)
    y += 13
  })
  doc.save('ncr-group-leads.pdf')
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}
