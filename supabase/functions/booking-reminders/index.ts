// Edge Function per promemoria prenotazioni automatici
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Crea client Supabase con service role (bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[BOOKING-REMINDERS] Inizio controllo promemoria...');

    // 1. Trova tutte le prenotazioni confermate future
    const now = new Date();
    const { data: upcomingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        professional_id,
        booking_date,
        booking_time,
        client_name,
        status
      `)
      .eq('status', 'confirmed')
      .gte('booking_date', now.toISOString().split('T')[0])
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    if (bookingsError) {
      console.error('[BOOKING-REMINDERS] Errore fetch prenotazioni:', bookingsError);
      throw bookingsError;
    }

    if (!upcomingBookings || upcomingBookings.length === 0) {
      console.log('[BOOKING-REMINDERS] Nessuna prenotazione futura trovata');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nessuna prenotazione da processare',
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[BOOKING-REMINDERS] Trovate ${upcomingBookings.length} prenotazioni future`);

    let remindersCreated = 0;
    let remindersSkipped = 0;

    // 2. Per ogni prenotazione, controlla se serve inviare promemoria
    for (const booking of upcomingBookings) {
      try {
        // Calcola data/ora appuntamento
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
        const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        console.log(`[BOOKING-REMINDERS] Booking ${booking.id}: ${hoursUntilBooking.toFixed(2)}h fino all'appuntamento`);

        // Salta se appuntamento è già passato o troppo lontano (> 48h)
        if (hoursUntilBooking <= 0 || hoursUntilBooking > 48) {
          console.log(`[BOOKING-REMINDERS] Booking ${booking.id} saltato: ${hoursUntilBooking <= 0 ? 'già passato' : 'troppo lontano (>48h)'}`);
          continue;
        }

        // 3. Recupera impostazioni professionista
        const { data: settings, error: settingsError } = await supabase
          .from('professional_settings')
          .select('notify_booking_reminder, reminder_hours_before')
          .eq('professional_id', booking.professional_id)
          .maybeSingle();

        if (settingsError) {
          console.error(`[BOOKING-REMINDERS] Errore fetch settings per booking ${booking.id}:`, settingsError);
          continue;
        }

        // Salta se promemoria disabilitati
        if (settings && settings.notify_booking_reminder === false) {
          continue;
        }

        // Usa tempi configurati o default [24, 2]
        const reminderHours = settings?.reminder_hours_before || [24, 2];
        const clientName = booking.client_name || 'Cliente';

        // 4. Controlla ogni tempo di promemoria configurato
        for (const hoursBefore of reminderHours) {
          // Calcola finestra temporale (es. se hoursBefore = 24, controlla tra 24h e 23h prima)
          // Allargata finestra: da 1h prima a 1h dopo il tempo target (più permissiva)
          const targetTime = hoursUntilBooking - hoursBefore;
          const windowStart = -1.0; // 1 ora di tolleranza prima (può inviare fino a 1h prima)
          const windowEnd = 1.0;    // 1 ora di tolleranza dopo (può inviare fino a 1h dopo)

          console.log(`[BOOKING-REMINDERS] Booking ${booking.id}, promemoria ${hoursBefore}h: targetTime=${targetTime.toFixed(2)}, window=[${windowStart}, ${windowEnd}], hoursUntil=${hoursUntilBooking.toFixed(2)}`);

          // Controlla se siamo nella finestra temporale per questo promemoria
          if (targetTime >= windowStart && targetTime <= windowEnd) {
            console.log(`[BOOKING-REMINDERS] ✅ Booking ${booking.id} nella finestra per promemoria ${hoursBefore}h`);
            // 5. Verifica se promemoria già inviato
            const { data: existingReminder } = await supabase
              .from('booking_reminders')
              .select('id')
              .eq('booking_id', booking.id)
              .eq('hours_before', hoursBefore)
              .maybeSingle();

            if (existingReminder) {
              console.log(`[BOOKING-REMINDERS] Promemoria già inviato per booking ${booking.id} (${hoursBefore}h prima)`);
              remindersSkipped++;
              continue;
            }

            // 6. Crea notifica promemoria
            const { data: notification, error: notifError } = await supabase
              .from('professional_notifications')
              .insert({
                professional_id: booking.professional_id,
                type: 'booking_reminder',
                title: 'Promemoria appuntamento',
                message: `Appuntamento con ${clientName} tra ${hoursBefore} ${hoursBefore === 1 ? 'ora' : 'ore'} - ${new Date(booking.booking_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} alle ${booking.booking_time}`,
                data: {
                  booking_id: booking.id,
                  client_name: clientName,
                  booking_date: booking.booking_date,
                  booking_time: booking.booking_time,
                  hours_before: hoursBefore
                },
                is_read: false
              })
              .select('id')
              .single();

            if (notifError) {
              console.error(`[BOOKING-REMINDERS] Errore creazione notifica per booking ${booking.id}:`, notifError);
              continue;
            }

            // 7. Salva tracking promemoria inviato
            const { error: reminderError } = await supabase
              .from('booking_reminders')
              .insert({
                booking_id: booking.id,
                professional_id: booking.professional_id,
                hours_before: hoursBefore,
                notification_id: notification.id
              });

            if (reminderError) {
              console.error(`[BOOKING-REMINDERS] Errore salvataggio tracking per booking ${booking.id}:`, reminderError);
              // Non bloccare, la notifica è già stata creata
            } else {
              console.log(`[BOOKING-REMINDERS] ✅ Promemoria creato per booking ${booking.id} (${hoursBefore}h prima)`);
              remindersCreated++;
            }
          }
        }
      } catch (err) {
        console.error(`[BOOKING-REMINDERS] Errore processando booking ${booking.id}:`, err);
        // Continua con prossimo booking
        continue;
      }
    }

    console.log(`[BOOKING-REMINDERS] Completato: ${remindersCreated} creati, ${remindersSkipped} saltati`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: upcomingBookings.length,
        remindersCreated,
        remindersSkipped
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[BOOKING-REMINDERS] Errore generale:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
