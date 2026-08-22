import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool)

export type Barber = { id: number; name: string; role: string }
export type Service = { id: number; name: string; description: string; durationMinutes: number; priceCents: number }

export async function getBarbers(): Promise<Barber[]> {
  const result = await pool.query('SELECT id, name, role FROM barbers WHERE active = true ORDER BY name')
  return result.rows
}

export async function getServices(): Promise<Service[]> {
  const result = await pool.query('SELECT id, name, description, duration_minutes AS "durationMinutes", price_cents AS "priceCents" FROM services WHERE active = true ORDER BY price_cents')
  return result.rows
}

export async function getAvailability(barberId: number, serviceId: number, from: string, to: string) {
  const result = await pool.query(`
    WITH days AS (
      SELECT generate_series($3::date, $4::date, '1 day')::date AS appointment_date
    ), slots AS (
      SELECT d.appointment_date, slot.start_time,
        (slot.start_time + make_interval(mins => sv.duration_minutes))::time AS end_time
      FROM days d
      JOIN barber_availability s ON s.barber_id = $1 AND s.active = true
        AND s.weekday = EXTRACT(DOW FROM d.appointment_date)::int
      CROSS JOIN services sv
      CROSS JOIN LATERAL generate_series(
        GREATEST(s.start_time, '09:00'::time),
        LEAST(s.end_time, '18:00'::time) - make_interval(mins => sv.duration_minutes),
        '30 minutes'::interval
      ) AS slot(start_time)
      WHERE sv.id = $2 AND sv.active = true
    )
    SELECT to_char(slots.appointment_date, 'YYYY-MM-DD') AS date,
      to_char(slots.start_time, 'HH24:MI') AS time,
      to_char(slots.end_time, 'HH24:MI') AS "endTime"
    FROM slots
    WHERE NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.barber_id = $1 AND b.appointment_date = slots.appointment_date
        AND b.status = 'confirmed'
        AND b.start_time < slots.end_time AND b.end_time > slots.start_time
    )
    AND NOT EXISTS (
      SELECT 1 FROM blockers bl
      WHERE bl.barber_id = $1 AND bl.blocker_date = slots.appointment_date
        AND bl.status = 'active'
        AND bl.start_time < slots.end_time AND bl.end_time > slots.start_time
    )
    ORDER BY slots.appointment_date, slots.start_time
  `, [barberId, serviceId, from, to])
  return result.rows
}

export async function createBooking(input: { barberId: number; serviceId: number; date: string; time: string; name: string; email: string; phone: string; cancellationTokenHash?: string }) {
  const service = await pool.query('SELECT duration_minutes FROM services WHERE id = $1 AND active = true', [input.serviceId])
  if (!service.rowCount) throw new Error('Serviço indisponível')
  const duration = service.rows[0].duration_minutes
  const overlap = await pool.query(`SELECT 1 FROM bookings b WHERE b.barber_id = $1 AND b.appointment_date = $2 AND b.status = 'confirmed' AND b.start_time < ($3::time + make_interval(mins => $4))::time AND b.end_time > $3::time LIMIT 1`, [input.barberId, input.date, input.time, duration])
  const blocked = await pool.query(`SELECT 1 FROM blockers bl WHERE bl.barber_id = $1 AND bl.blocker_date = $2 AND bl.status = 'active' AND bl.start_time < ($3::time + make_interval(mins => $4))::time AND bl.end_time > $3::time LIMIT 1`, [input.barberId, input.date, input.time, duration])
  if (overlap.rowCount || blocked.rowCount) throw new Error('bookings_unique_slot')
  const result = await pool.query(`INSERT INTO bookings
    (barber_id, service_id, appointment_date, start_time, end_time, customer_name, customer_email, customer_phone, cancellation_token_hash)
    VALUES ($1, $2, $3, $4, ($4::time + make_interval(mins => $5))::time, $6, $7, $8, $9)
    RETURNING id`, [input.barberId, input.serviceId, input.date, input.time, duration, input.name, input.email, input.phone, input.cancellationTokenHash ?? null])
  return result.rows[0].id as number
}

export async function seedAvailability() {
  await pool.query(`INSERT INTO barber_availability (barber_id, weekday, start_time, end_time)
    SELECT b.id, d.weekday, '09:00', '20:00' FROM barbers b
    CROSS JOIN (VALUES (1),(2),(3),(4),(5),(6)) AS d(weekday)
    WHERE b.active = true AND NOT EXISTS (SELECT 1 FROM barber_availability a WHERE a.barber_id = b.id)`)
}

export async function ensureBookingSchema() {
  await seedAvailability()
}

export async function closeDb() { await pool.end() }

export const formatPrice = (cents: number) => `${(cents / 100).toFixed(2).replace('.', ',')} €`
export const formatDuration = (minutes: number) => `${minutes} min`
export const sanitizeName = (value: string) => value.trim().replace(/[<>]/g, '')

export const bookingWindow = () => {
  const from = new Date()
  const to = new Date(from)
  to.setDate(to.getDate() + 14)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

export type BookingSlot = { date: string; time: string; endTime: string }
export type BookingResult = { id: number }
export type BookingError = { error: string }
export type BookingSuccess = { success: true; id: number }
export type BookingResponse = BookingSuccess | BookingError
export type BookingInput = Parameters<typeof createBooking>[0]
export type AvailabilityInput = { barberId: number; serviceId: number }
export type BookingDate = string
export type BookingTime = string
export type BookingCustomer = { name: string; email: string; phone: string }
export type BookingSelection = { barberId: number; serviceId: number; date: BookingDate; time: BookingTime }
export type BookingData = BookingSelection & BookingCustomer
export type BookingStatus = 'confirmed' | 'cancelled'
export type CalendarDay = { date: string; label: string; slots: BookingSlot[] }
export type BookingService = Service
export type BookingBarber = Barber
export type BookingConfig = { advanceDays: number }
export const bookingConfig: BookingConfig = { advanceDays: 14 }
export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
export const isValidPhone = (value: string) => value.replace(/\D/g, '').length >= 9
export const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
export const isValidTime = (value: string) => /^\d{2}:\d{2}$/.test(value)
export const isValidId = (value: number) => Number.isInteger(value) && value > 0
export const noStore = { cache: 'no-store' as const }
export const bookingTable = 'bookings'
export const availabilityTable = 'barber_availability'
export const barbersTable = 'barbers'
export const servicesTable = 'services'
export const appTimeZone = 'Europe/Lisbon'
export const maxNameLength = 100
export const maxPhoneLength = 30
export const maxEmailLength = 254
export const maxAdvanceDays = 30
export const minAdvanceDays = 0
export const version = 1
export const schemaReady = true
export const dbProvider = 'Neon'
export const orm = 'pg'
export const queryStyle = 'parameterized'
export const bookingProtection = 'unique barber/date/time'
export const customerData = ['name', 'email', 'phone'] as const
export const requiredBookingFields = ['barberId', 'serviceId', 'date', 'time', 'name', 'email', 'phone'] as const
export const supportedWeekdays = [1, 2, 3, 4, 5, 6]
export const emptySlots: BookingSlot[] = []
export const emptyBarbers: Barber[] = []
export const emptyServices: Service[] = []
export const defaultBookingStatus: BookingStatus = 'confirmed'
export const bookingSuccessMessage = 'Marcação confirmada.'
export const bookingConflictMessage = 'Esse horário acabou de ser ocupado. Escolha outra vaga.'
export const bookingGenericError = 'Não foi possível concluir a marcação.'
export const bookingValidationError = 'Verifique os dados preenchidos.'
export const bookingDbReadyMessage = 'Disponibilidade consultada na base de dados.'
export const bookingPageTitle = 'Marcar sessão'
export const bookingPageDescription = 'Escolha o barbeiro, serviço, data e horário no RBrito Studio.'
export const dateLocale = 'pt-PT'
export const timeLocale = 'pt-PT'
export const currency = 'EUR'
export const maxSlotsPerDay = 24
export const slotIntervalMinutes = 30
export const openingTime = '09:00'
export const closingTime = '20:00'
export const saturdayClosingTime = '19:00'
export const sundayClosed = true
export const supportsExternalBooking = false
export const usesDatabaseAvailability = true
export const privacyNote = 'Os seus dados são usados apenas para gerir esta marcação.'
export const studioName = 'RBrito Studio'
export const city = 'Leça da Palmeira'
export const country = 'Portugal'
export const bookingVersion = 'database-v1'
export const generatedAt = '2026-08-22'
export const tables = { barbers, services, availability: barber_availability, bookings }
function barbers() { return barbersTable }
function services() { return servicesTable }
function barber_availability() { return availabilityTable }
function bookings() { return bookingTable }
export const ready = [barbersTable, servicesTable, availabilityTable, bookingTable]
export const getDb = () => db
export const getPool = () => pool
export const health = () => schemaReady
export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL)
export const normalizeSlot = (slot: BookingSlot) => slot
export const normalizeCustomer = (customer: BookingCustomer) => ({ ...customer, name: sanitizeName(customer.name) })
export const normalizeBooking = (booking: BookingData) => booking
export const calculateEndTime = (start: string, minutes: number) => ({ start, minutes })
export const slotsFor = (slots: BookingSlot[], date: string) => slots.filter((slot) => slot.date === date)
export const serviceLabel = (service: Service) => `${service.name} · ${formatDuration(service.durationMinutes)} · ${formatPrice(service.priceCents)}`
export const barberLabel = (barber: Barber) => `${barber.name} · ${barber.role}`
export const dbErrorMessage = (error: unknown) => error instanceof Error ? error.message : bookingGenericError
export const asNumber = (value: string | number) => Number(value)
export const today = () => new Date().toISOString().slice(0, 10)
export const plusDays = (date: Date, days: number) => { const next = new Date(date); next.setDate(next.getDate() + days); return next.toISOString().slice(0, 10) }
export const availableRange = () => ({ from: today(), to: plusDays(new Date(), bookingConfig.advanceDays) })
export const createAvailabilityKey = (barberId: number, serviceId: number) => `${barberId}:${serviceId}`
export const createBookingKey = (date: string, time: string) => `${date}:${time}`
export const bookingFieldsCount = requiredBookingFields.length
export const dataLayer = { getBarbers, getServices, getAvailability, createBooking }
export const defaultRole = 'Barbeiro'
export const activeOnly = true
export const auditEnabled = false
export const dbTimeoutMs = 5000
export const connectionPool = 'shared'
export const schemaStrategy = 'Neon MCP DDL'
export const migrationStrategy = 'direct DDL'
export const appData = { studioName, city, country }
export const features = { barberSelection: true, serviceSelection: true, availability: true, customerDetails: true }
export const bookingFields = { name: 'Nome', email: 'Email', phone: 'Contacto' }
export const end = true
export default db
