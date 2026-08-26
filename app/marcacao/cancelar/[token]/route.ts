import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { pool } from '@/lib/db'
import { sendCancellationEmail } from '@/lib/booking-email'

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const result = await pool.query(`UPDATE bookings SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW() WHERE cancellation_token_hash = $1 AND status = 'confirmed' RETURNING customer_email AS email, customer_name AS name`, [hash])
  if (!result.rowCount) return new NextResponse('<h1>Link inválido ou marcação já cancelada</h1>', { headers: { 'content-type': 'text/html; charset=utf-8' }, status: 404 })
  await sendCancellationEmail(result.rows[0].email, result.rows[0].name).catch(() => undefined)
  return NextResponse.redirect(new URL('/marcacao?cancelada=1', request.url))
}
