import { NextRequest, NextResponse } from 'next/server';
import { createTransporter, sendReportEmail } from '../../../lib/email-sender';
import { generateReportPDF } from '../../../lib/pdf-generator';

export async function POST(request: NextRequest) {
  try {
    console.log('📨 Richiesta generazione report ricevuta');
    
    const body = await request.json();
    const { email, risultatoIMU, immobili } = body;
    
    if (!email || !risultatoIMU || !immobili) {
      return NextResponse.json(
        { error: 'Email, risultato IMU e immobili sono richiesti' },
        { status: 400 }
      );
    }
    
    console.log('📄 Generazione PDF in corso...');
    
    // Genera il PDF del report
    const pdfBuffer = await generateReportPDF({
      immobili,
      risultatoIMU,
      dataGenerazione: new Date()
    });
    
    console.log('📧 Invio email in corso...');
    
    // Invia l'email con il PDF allegato
    await sendReportEmail({
      to: email,
      pdfBuffer,
      risultatoIMU
    });
    
    console.log('✅ Report inviato con successo a:', email);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Report inviato con successo' 
    });
    
  } catch (error) {
    console.error('❌ Errore nella generazione/invio report:', error);
    return NextResponse.json(
      { error: 'Errore nella generazione del report' },
      { status: 500 }
    );
  }
} 