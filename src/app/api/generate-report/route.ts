import { NextRequest, NextResponse } from 'next/server';
import { generateReportPDF } from '@/lib/pdf-generator';
import { sendReportEmail } from '@/lib/email-sender';

// Indica a Next.js che questa route è dinamica
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    console.log('📨 Richiesta generazione report ricevuta');
    
    const body = await request.json();
    const { email, risultatoIMU, immobili } = body;
    
    if (!email || !risultatoIMU || !immobili) {
      return NextResponse.json(
        { error: 'Dati mancanti: email, risultatoIMU e immobili sono richiesti' },
        { status: 400 }
      );
    }
    
    console.log('📄 Generazione PDF in corso...');
    
    // Genera il PDF
    const pdfBuffer = await generateReportPDF({
      immobili,
      risultatoIMU,
      dataGenerazione: new Date()
    });
    
    console.log('📧 Invio email in corso...');
    
    // Invia l'email
    const emailResult = await sendReportEmail({
      to: email,
      pdfBuffer,
      risultatoIMU
    });
    
    console.log('✅ Report inviato con successo a:', email);
    
    return NextResponse.json({
      success: true,
      message: 'Report generato e inviato con successo!',
      emailId: emailResult.data?.id
    });
    
  } catch (error) {
    console.error('❌ Errore nella generazione/invio report:', error);
    
    return NextResponse.json(
      { 
        error: 'Errore nella generazione del report',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    );
  }
} 