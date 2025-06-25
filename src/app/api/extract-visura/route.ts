import { NextRequest, NextResponse } from 'next/server';
import { extractVisuraData } from '@/lib/extract-visura';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Inizio elaborazione richiesta POST /api/extract-visura');
    
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      console.log('❌ Nessun file PDF fornito');
      return NextResponse.json(
        { error: 'Nessun file PDF fornito' },
        { status: 400 }
      );
    }

    console.log('📄 File ricevuto:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    if (file.type !== 'application/pdf') {
      console.log('❌ Tipo file non valido:', file.type);
      return NextResponse.json(
        { error: 'Il file deve essere in formato PDF' },
        { status: 400 }
      );
    }

    // Converti il file in buffer
    console.log('🔄 Conversione file in buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    console.log('✅ Buffer creato, dimensione:', pdfBuffer.length);

    // Verifica chiave OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Chiave OpenAI non configurata');
      return NextResponse.json(
        { error: 'Configurazione OpenAI mancante' },
        { status: 500 }
      );
    }
    console.log('✅ Chiave OpenAI presente');

    // Estrai i dati dalla visura
    console.log('🔍 Inizio estrazione dati...');
    const result = await extractVisuraData(pdfBuffer);
    console.log('✅ Estrazione completata:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Errore nell\'estrazione della visura:', error);
    // Log dettagliato dell'errore
    if (error instanceof Error) {
      console.error('Dettagli errore:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Errore interno del server durante l\'estrazione dei dati' },
      { status: 500 }
    );
  }
} 