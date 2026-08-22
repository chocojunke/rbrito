import { Resend } from 'resend'

export async function sendBookingEmail(input: { email: string; name: string; date: string; time: string; service: string; barber: string; token: string }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/marcacao/cancelar/${input.token}`
  await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL, to: input.email, subject: 'Marcação confirmada — RBrito Studio', html: `<h2>Marcação confirmada</h2><p>Olá ${input.name}, a sua sessão de <strong>${input.service}</strong> com ${input.barber} está marcada para <strong>${input.date} às ${input.time}</strong>.</p><p>Se precisar de desmarcar, use este link: <a href="${cancelUrl}">${cancelUrl}</a></p><p>RBrito Studio · Leça da Palmeira</p>` })
}

export async function sendCancellationEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL, to: email, subject: 'Marcação cancelada — RBrito Studio', html: `<p>Olá ${name}, a sua marcação foi cancelada com sucesso.</p>` })
}
