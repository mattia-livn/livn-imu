import { NextRequest, NextResponse } from 'next/server';
import { extractVisuraData } from '@/lib/extract-visura';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file PDF fornito' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Il file deve essere in formato PDF' },
        { status: 400 }
      );
    }

    // Converti il file in buffer
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Estrai i dati dalla visura
    const result = await extractVisuraData(pdfBuffer);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Errore nell\'estrazione della visura:', error);
    return NextResponse.json(
      { error: 'Errore interno del server durante l\'estrazione dei dati' },
      { status: 500 }
    );
  }
} 