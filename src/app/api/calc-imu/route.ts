import { NextRequest, NextResponse } from 'next/server';
import { calcolaIMUCompleto } from '@/lib/calc-imu';

// Interfacce per il request body
interface ImmobileInput {
  id: string;
  indirizzo: string;
  citta: string;
  provincia: string;
  categoria: string;
  rendita: number;
  tipo_contratto: 'none' | 'libero' | 'concordato' | 'transitorio' | 'studenti' | 'comodato';
  abitazione_principale: boolean;
  pertinenza: boolean;
  pertinenza_di: string | null;
  anno: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📨 Richiesta calcolo IMU ricevuta:', body);

    // Verifica che ci siano immobili da calcolare
    if (!body.immobili || !Array.isArray(body.immobili) || body.immobili.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nessun immobile fornito per il calcolo' 
        },
        { status: 400 }
      );
    }

    // Calcolo IMU per tutti gli immobili
    const immobili: ImmobileInput[] = body.immobili;
    const risultato = await calcolaIMUCompleto(immobili);
    
    return NextResponse.json({
      success: true,
      risultato
    });

  } catch (error) {
    console.error('❌ Errore nel calcolo IMU:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Errore sconosciuto nel calcolo IMU' 
      },
      { status: 500 }
    );
  }
} 