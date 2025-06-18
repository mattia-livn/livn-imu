import { supabase } from './supabase';
import { 
  Immobile, 
  InputCalcoloIMU, 
  OutputCalcoloIMU, 
  OutputCalcoloProgetto, 
  AliquotaIMU,
  TipoContratto 
} from './types';

/**
 * 🏠 CALCOLA IMU PER SINGOLO IMMOBILE
 * Implementa la logica definita in calc-imu.md
 */
export async function calcolaIMUSingoloImmobile(input: InputCalcoloIMU): Promise<OutputCalcoloIMU> {
  console.log('🔍 Inizio calcolo IMU per singolo immobile:', input);

  // 1️⃣ Carica aliquota da Supabase
  const { data: aliquote, error } = await supabase
    .from('imu_aliquote')
    .select('*')
    .eq('anno', input.anno)
    .eq('comune', input.citta.toUpperCase())  // Usa 'citta' invece di 'comune'
    .eq('provincia', input.provincia.toUpperCase())
    .eq('categoria', input.categoria.toUpperCase())
    .limit(1);

  if (error) {
    console.error('❌ Errore nel recupero aliquote:', error);
    throw new Error(`Errore nel recupero delle aliquote: ${error.message}`);
  }

  if (!aliquote || aliquote.length === 0) {
    throw new Error(`Aliquote non trovate per: ${input.citta} (${input.provincia}) - ${input.categoria} - Anno ${input.anno}`);
  }

  const aliquota: AliquotaIMU = aliquote[0];
  console.log('📊 Aliquota trovata:', aliquota);

  // 2️⃣ Determina quale aliquota applicare
  let percentualeApplicata: number;

  if (input.abitazione_principale) {
    // Abitazione principale
    if (['A/1', 'A/8', 'A/9'].includes(input.categoria.toUpperCase())) {
      percentualeApplicata = (aliquota as any)['%_abitazione_principale_lusso'];
      console.log('🏛️ Applicata aliquota abitazione principale di lusso');
    } else {
      percentualeApplicata = (aliquota as any)['%_abitazione_principale'];
      console.log('🏠 Applicata aliquota abitazione principale');
    }
  } else {
    // Non abitazione principale - controlla tipo contratto
    switch (input.tipo_contratto) {
      case 'libero':
        percentualeApplicata = (aliquota as any)['%_locato_libero'];
        console.log('📄 Applicata aliquota locazione libera');
        break;
      case 'concordato':
        percentualeApplicata = (aliquota as any)['%_locato_concordato'];
        console.log('📋 Applicata aliquota locazione concordata');
        break;
      case 'transitorio':
        percentualeApplicata = (aliquota as any)['%_locato_transitorio'];
        console.log('⏱️ Applicata aliquota locazione transitoria');
        break;
      case 'studenti':
        percentualeApplicata = (aliquota as any)['%_locato_studenti'];
        console.log('🎓 Applicata aliquota locazione studenti');
        break;
      case 'comodato_parenti':
        percentualeApplicata = (aliquota as any)['%_comodato_parenti'];
        console.log('👨‍👩‍👧‍👦 Applicata aliquota comodato parenti');
        break;
      case 'none':
      default:
        percentualeApplicata = (aliquota as any)['%_default'];
        console.log('⚖️ Applicata aliquota default');
        break;
    }
  }

  // 3️⃣ Calcola base imponibile
  let baseImponibile = (input.rendita * 1.05) * 160;
  console.log(`💰 Base imponibile iniziale: ${baseImponibile.toFixed(2)}€`);

  // 4️⃣ Applica riduzione per comodato parenti (50%)
  if (input.tipo_contratto === 'comodato_parenti') {
    baseImponibile = baseImponibile * 0.5;
    console.log(`💰 Base imponibile ridotta (comodato parenti -50%): ${baseImponibile.toFixed(2)}€`);
  }

  // 5️⃣ Calcola IMU finale
  const imuCalcolata = (baseImponibile * percentualeApplicata) / 100;

  const risultato: OutputCalcoloIMU = {
    aliquota_utilizzata: percentualeApplicata,
    base_imponibile: parseFloat(baseImponibile.toFixed(2)),
    imu_calcolata: parseFloat(imuCalcolata.toFixed(2))
  };

  console.log('✅ Calcolo completato:', risultato);
  return risultato;
}

/**
 * 🏘️ CALCOLA IMU PER PROGETTO COMPLETO
 * Implementa la logica definita in calc-imu-progetto.md
 * Gestisce correttamente le pertinenze multiple
 */
export async function calcolaIMUProgetto(immobili: Immobile[]): Promise<OutputCalcoloProgetto> {
  console.log('🏘️ Inizio calcolo IMU per progetto completo:', immobili.length, 'immobili');

  const dettaglioPerImmobile: OutputCalcoloProgetto['dettaglio_per_immobile'] = [];
  let imuTotale = 0;

  // 1️⃣ Raggruppa per abitazione principale e trova pertinenze
  const abitazioniPrincipali = immobili.filter(i => i.abitazione_principale);
  
  for (const abitazione of abitazioniPrincipali) {
    console.log(`🏠 Elaborando abitazione principale: ${abitazione.indirizzo}`);

    // Trova tutte le pertinenze di questa abitazione
    const pertinenze = immobili.filter(i => 
      i.pertinenza && 
      i.pertinenza_di === abitazione.id &&
      i.citta.toUpperCase() === abitazione.citta.toUpperCase() &&
      i.provincia.toUpperCase() === abitazione.provincia.toUpperCase()
    );

    console.log(`🔗 Trovate ${pertinenze.length} pertinenze valide per ${abitazione.indirizzo}`);

    // 2️⃣ Gestione pertinenze per categoria
    const pertinenzeTrattateComeAgevolate = new Set<string>();

    // Raggruppa per categoria e trova quella con rendita massima
    const categorieValide = ['C/2', 'C/6', 'C/7'];
    
    for (const categoria of categorieValide) {
      const pertinenzeDiCategoria = pertinenze.filter(p => 
        p.categoria.toUpperCase() === categoria
      );

      if (pertinenzeDiCategoria.length > 0) {
        // Ordina per rendita decrescente e prendi la prima
        pertinenzeDiCategoria.sort((a, b) => b.rendita - a.rendita);
        const pertinenzaAgevolata = pertinenzeDiCategoria[0];
        pertinenzeTrattateComeAgevolate.add(pertinenzaAgevolata.id);

        console.log(`🎯 Pertinenza agevolata ${categoria}: ${pertinenzaAgevolata.indirizzo} (rendita: ${pertinenzaAgevolata.rendita})`);
      }
    }

    // 3️⃣ Calcola IMU per abitazione principale
    const inputAbitazione: InputCalcoloIMU = {
      anno: (abitazione as any).anno,
      citta: abitazione.citta,
      provincia: abitazione.provincia,
      categoria: abitazione.categoria,
      rendita: abitazione.rendita,
      abitazione_principale: true,
      tipo_contratto: abitazione.tipo_contratto
    };

    const risultatoAbitazione = await calcolaIMUSingoloImmobile(inputAbitazione);
    
    dettaglioPerImmobile.push({
      id: abitazione.id,
      aliquota_utilizzata: risultatoAbitazione.aliquota_utilizzata,
      base_imponibile: risultatoAbitazione.base_imponibile,
      imu_calcolata: risultatoAbitazione.imu_calcolata
    });
    
    imuTotale += risultatoAbitazione.imu_calcolata;

    // 4️⃣ Calcola IMU per pertinenze
    for (const pertinenza of pertinenze) {
      const inputPertinenza: InputCalcoloIMU = {
        anno: (pertinenza as any).anno,
        citta: pertinenza.citta,
        provincia: pertinenza.provincia,
        categoria: pertinenza.categoria,
        rendita: pertinenza.rendita,
        abitazione_principale: pertinenzeTrattateComeAgevolate.has(pertinenza.id),
        tipo_contratto: pertinenza.tipo_contratto
      };

      const risultatoPertinenza = await calcolaIMUSingoloImmobile(inputPertinenza);
      
      dettaglioPerImmobile.push({
        id: pertinenza.id,
        aliquota_utilizzata: risultatoPertinenza.aliquota_utilizzata,
        base_imponibile: risultatoPertinenza.base_imponibile,
        imu_calcolata: risultatoPertinenza.imu_calcolata
      });
      
      imuTotale += risultatoPertinenza.imu_calcolata;

      console.log(`${pertinenzeTrattateComeAgevolate.has(pertinenza.id) ? '🎯' : '⚖️'} Pertinenza ${pertinenza.categoria}: ${risultatoPertinenza.imu_calcolata}€`);
    }
  }

  // 5️⃣ Gestisci immobili senza collegamento (non pertinenze, non abitazioni principali)
  const immobiliOrdinari = immobili.filter(i => 
    !i.abitazione_principale && 
    (!i.pertinenza || !i.pertinenza_di)
  );

  for (const immobile of immobiliOrdinari) {
    console.log(`🏢 Elaborando immobile ordinario: ${immobile.indirizzo}`);

    const inputImmobile: InputCalcoloIMU = {
      anno: (immobile as any).anno,
      citta: immobile.citta,
      provincia: immobile.provincia,
      categoria: immobile.categoria,
      rendita: immobile.rendita,
      abitazione_principale: false,
      tipo_contratto: immobile.tipo_contratto
    };

    const risultatoImmobile = await calcolaIMUSingoloImmobile(inputImmobile);
    
    dettaglioPerImmobile.push({
      id: immobile.id,
      aliquota_utilizzata: risultatoImmobile.aliquota_utilizzata,
      base_imponibile: risultatoImmobile.base_imponibile,
      imu_calcolata: risultatoImmobile.imu_calcolata
    });
    
    imuTotale += risultatoImmobile.imu_calcolata;
  }

  const risultatoFinale: OutputCalcoloProgetto = {
    imu_totale: parseFloat(imuTotale.toFixed(2)),
    dettaglio_per_immobile: dettaglioPerImmobile
  };

  console.log('🎉 Calcolo progetto completato:', risultatoFinale);
  return risultatoFinale;
} 