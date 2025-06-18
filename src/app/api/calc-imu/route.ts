import { NextRequest, NextResponse } from 'next/server';
import { calcolaIMUSingoloImmobile, calcolaIMUProgetto } from '@/lib/calc-imu';
import { Immobile, InputCalcoloIMU } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📨 Richiesta calcolo IMU ricevuta:', body);

    // Determina se è calcolo singolo o progetto
    if (body.tipo === 'singolo' && body.immobile) {
      // 🏠 Calcolo singolo immobile
      const input: InputCalcoloIMU = body.immobile;
      const risultato = await calcolaIMUSingoloImmobile(input);
      
      return NextResponse.json({
        success: true,
        tipo: 'singolo',
        risultato
      });

    } else if (body.tipo === 'progetto' && body.immobili) {
      // 🏘️ Calcolo progetto completo
      const immobili: Immobile[] = body.immobili;
      const risultato = await calcolaIMUProgetto(immobili);
      
      return NextResponse.json({
        success: true,
        tipo: 'progetto',
        risultato
      });

    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Tipo di calcolo non riconosciuto. Specificare tipo: "singolo" o "progetto"' 
        },
        { status: 400 }
      );
    }

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