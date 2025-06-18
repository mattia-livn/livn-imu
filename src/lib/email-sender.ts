import { Resend } from 'resend';

interface EmailConfig {
  to: string;
  pdfBuffer: Buffer;
  risultatoIMU: { imu_totale: number; dettaglio_per_immobile: Array<{ id: string; aliquota_utilizzata: number; base_imponibile: number; imu_calcolata: number; }> };
}

export function createResendClient() {
  // Verifica che la chiave API Resend sia configurata
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      'Configurazione email mancante. Aggiungi RESEND_API_KEY al file .env.local'
    );
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendReportEmail({ to, pdfBuffer, risultatoIMU }: EmailConfig) {
  const resend = createResendClient();
  
  const dataOggi = new Date().toLocaleDateString('it-IT');
  const importoTotale = risultatoIMU.imu_totale?.toFixed(2) || '0.00';
  const primaRata = ((risultatoIMU.imu_totale || 0) / 2).toFixed(2);
  const secondaRata = ((risultatoIMU.imu_totale || 0) / 2).toFixed(2);
  
  // Converti il PDF buffer in base64 come richiesto dalla documentazione Resend
  const pdfBase64 = pdfBuffer.toString('base64');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .summary { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
        .amount { font-size: 24px; font-weight: bold; color: #1d4ed8; }
        .rate { background: #e0f2fe; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .footer { background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏠 Report Calcolo IMU 2025</h1>
        <p>Generato il ${dataOggi}</p>
      </div>
      
      <div class="content">
        <h2>Gentile Cliente,</h2>
        <p>Ecco il suo report dettagliato del calcolo IMU per l'anno 2025.</p>
        
        <div class="summary">
          <h3>💰 Riepilogo Pagamento</h3>
          <div class="amount">Totale IMU 2025: €${importoTotale}</div>
          
          <div class="rate">
            <strong>📅 Prima Rata (scadenza 16 giugno 2025)</strong><br>
            Importo: €${primaRata}
          </div>
          
          <div class="rate">
            <strong>📅 Seconda Rata (scadenza 16 dicembre 2025)</strong><br>
            Importo: €${secondaRata}
          </div>
        </div>
        
        <p><strong>📋 Il report PDF allegato contiene:</strong></p>
        <ul>
          <li>🏠 Dettaglio completo di tutti gli immobili</li>
          <li>📊 Aliquote applicate per ogni immobile</li>
          <li>💰 Calcolo dettagliato dell'IMU</li>
          <li>📅 Scadenze e importi delle rate</li>
        </ul>
        
        <p>Conservi questo documento per i suoi archivi fiscali.</p>
        
        <p>Cordiali saluti,<br><strong>Il Team di Livn IMU</strong></p>
      </div>
      
      <div class="footer">
        <p>Questo report è stato generato automaticamente dal sistema Livn IMU</p>
        <p>Per assistenza contatti il nostro supporto tecnico</p>
      </div>
    </body>
    </html>
  `;
  
  // Seguiamo esattamente la documentazione ufficiale di Resend
  const result = await resend.emails.send({
    from: 'Livn IMU <onboarding@resend.dev>',
    to: [to], // Array come nell'esempio
    subject: `🏠 Report Calcolo IMU 2025 - €${importoTotale}`,
    html: htmlContent,
    attachments: [
      {
        content: pdfBase64, // Base64 encoded content come nella documentazione
        filename: `Report_IMU_2025_${dataOggi.replace(/\//g, '-')}.pdf`,
      }
    ]
  });
  
  return result;
} 