import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!process.env.RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY non configurata' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Test email semplice esattamente come nell'esempio di Resend
    const result = await resend.emails.send({
      from: 'Test <onboarding@resend.dev>',
      to: [email],
      subject: '🧪 Test Email da Livn IMU',
      html: '<h1>🎉 Funziona!</h1><p>Se ricevi questa email, Resend è configurato correttamente!</p>',
    });

    console.log('✅ Risultato invio email test:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email di test inviata!',
        result: result 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Errore nell\'invio email test:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Errore nell\'invio email', 
        details: error instanceof Error ? error.message : 'Errore sconosciuto' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 