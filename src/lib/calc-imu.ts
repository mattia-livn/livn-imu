import { createClient } from '@supabase/supabase-js';

// Tipi per i dati immobiliari
interface ImmobileInput {
  id: string;
  indirizzo: string;
  citta: string;
  provincia: string;
  categoria: string;
  rendita: number;
  esenzioni?: {
    prima_casa?: boolean;
    esenzione_rurale?: boolean;
    esenzione_parziale?: boolean;
  };
}

interface ConfigurazioneFiscale {
  aliquota_normale: number;
  aliquota_prima_casa: number;
  detrazione_prima_casa: number;
  moltiplicatore_categoria: Record<string, number>;
}

interface RisultatoCalcoloImmobile {
  id: string;
  aliquota_utilizzata: number;
  base_imponibile: number;
  imu_calcolata: number;
  detrazione_applicata: number;
  prima_casa: boolean;
}

interface RisultatoCalcoloCompleto {
  imu_totale: number;
  dettaglio_per_immobile: RisultatoCalcoloImmobile[];
}

// Inizializzazione Supabase (solo runtime)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('⚠️ Configurazione Supabase mancante - usando valori di default');
}

// Moltiplicatori catastali per categoria (valori standard 2024)
const MOLTIPLICATORI_CATASTALI: Record<string, number> = {
  'A/1': 176,
  'A/2': 140,
  'A/3': 126,
  'A/4': 110,
  'A/5': 140,
  'A/6': 126,
  'A/7': 110,
  'A/8': 140,
  'A/9': 140,
  'A/10': 126,
  'A/11': 126,
  'B/1': 176,
  'B/2': 176,
  'B/3': 176,
  'B/4': 176,
  'B/5': 176,
  'B/6': 176,
  'B/7': 176,
  'B/8': 176,
  'C/1': 55,
  'C/2': 34,
  'C/3': 34,
  'C/4': 34,
  'C/5': 34,
  'C/6': 55,
  'C/7': 34,
  'D/1': 65,
  'D/2': 80,
  'D/3': 80,
  'D/4': 65,
  'D/5': 80,
  'D/6': 65,
  'D/7': 65,
  'D/8': 140,
  'D/9': 80,
  'D/10': 80,
  'E/1': 65,
  'E/2': 140,
  'E/3': 140,
  'E/4': 140,
  'E/5': 140,
  'E/6': 140,
  'E/7': 140,
  'E/8': 140,
  'E/9': 80
};

/**
 * Ottiene la configurazione fiscale per un comune dal database
 */
async function getConfigurazioneFiscale(provincia: string, citta: string): Promise<ConfigurazioneFiscale> {
  try {
    // Se Supabase non è configurato, usa i valori di default
    if (!supabase) {
      console.warn(`⚠️ Supabase non configurato - usando valori default per ${citta} (${provincia})`);
      return getConfigurazioneDefault();
    }

    const { data, error } = await supabase
      .from('aliquote_imu')
      .select('aliquota_normale, aliquota_prima_casa, detrazione_prima_casa')
      .eq('provincia', provincia.toUpperCase())
      .ilike('comune', citta)
      .limit(1);

    if (error) {
      console.warn(`Errore ricerca aliquote per ${citta} (${provincia}):`, error);
      return getConfigurazioneDefault();
    }

    if (!data || data.length === 0) {
      console.warn(`Aliquote non trovate per ${citta} (${provincia}). Usando valori di default.`);
      return getConfigurazioneDefault();
    }

    const aliquotes = data[0];
    
    return {
      aliquota_normale: Number(aliquotes.aliquota_normale) || 0.86, // Default 0.86%
      aliquota_prima_casa: Number(aliquotes.aliquota_prima_casa) || 0.4, // Default 0.4%
      detrazione_prima_casa: Number(aliquotes.detrazione_prima_casa) || 200, // Default €200
      moltiplicatore_categoria: MOLTIPLICATORI_CATASTALI
    };

  } catch (error) {
    console.error('Errore nel recupero aliquotes:', error);
    return getConfigurazioneDefault();
  }
}

/**
 * Configurazione di default in caso di errori o dati mancanti
 */
function getConfigurazioneDefault(): ConfigurazioneFiscale {
  return {
    aliquota_normale: 0.86, // 0.86%
    aliquota_prima_casa: 0.4, // 0.4%
    detrazione_prima_casa: 200, // €200
    moltiplicatore_categoria: MOLTIPLICATORI_CATASTALI
  };
}

/**
 * Calcola l'IMU per un singolo immobile
 */
function calcolaIMUPerImmobile(
  immobile: ImmobileInput, 
  configurazione: ConfigurazioneFiscale
): RisultatoCalcoloImmobile {
  // 1. Calcolo base imponibile
  const moltiplicatore = configurazione.moltiplicatore_categoria[immobile.categoria] || 126;
  const baseImponibile = immobile.rendita * moltiplicatore;
  
  // 2. Verifica se è prima casa
  const isPrimaCasa = immobile.esenzioni?.prima_casa || false;
  
  // 3. Selezione aliquota
  const aliquotaPercentuale = isPrimaCasa 
    ? configurazione.aliquota_prima_casa 
    : configurazione.aliquota_normale;
  
  // 4. Calcolo IMU base
  const imuBase = (baseImponibile * aliquotaPercentuale) / 100;
  
  // 5. Applicazione detrazione prima casa
  const detrazioneApplicata = isPrimaCasa ? configurazione.detrazione_prima_casa : 0;
  
  // 6. Calcolo IMU finale (minimo 0)
  const imuFinale = Math.max(0, imuBase - detrazioneApplicata);
  
  return {
    id: immobile.id,
    aliquota_utilizzata: aliquotaPercentuale,
    base_imponibile: baseImponibile,
    imu_calcolata: Number(imuFinale.toFixed(2)),
    detrazione_applicata: detrazioneApplicata,
    prima_casa: isPrimaCasa
  };
}

/**
 * Funzione principale per calcolare l'IMU di tutti gli immobili
 */
export async function calcolaIMUCompleto(immobili: ImmobileInput[]): Promise<RisultatoCalcoloCompleto> {
  try {
    // Raggruppa immobili per provincia/città per minimizzare le query
    const comuniUnique = Array.from(
      new Set(immobili.map(i => `${i.provincia}|${i.citta}`))
    );
    
    // Crea una mappa delle configurazioni per comune
    const configurazioniPerComune: Record<string, ConfigurazioneFiscale> = {};
    
    for (const comuneKey of comuniUnique) {
      const [provincia, citta] = comuneKey.split('|');
      configurazioniPerComune[comuneKey] = await getConfigurazioneFiscale(provincia, citta);
    }
    
    // Calcola IMU per ogni immobile
    const dettaglioPerImmobile: RisultatoCalcoloImmobile[] = [];
    
    for (const immobile of immobili) {
      const comuneKey = `${immobile.provincia}|${immobile.citta}`;
      const configurazione = configurazioniPerComune[comuneKey];
      
      const risultatoImmobile = calcolaIMUPerImmobile(immobile, configurazione);
      dettaglioPerImmobile.push(risultatoImmobile);
    }
    
    // Calcola totale IMU
    const imuTotale = dettaglioPerImmobile.reduce(
      (totale, immobile) => totale + immobile.imu_calcolata, 
      0
    );
    
    return {
      imu_totale: Number(imuTotale.toFixed(2)),
      dettaglio_per_immobile: dettaglioPerImmobile
    };
    
  } catch (error) {
    console.error('Errore nel calcolo IMU:', error);
    throw new Error('Errore durante il calcolo dell\'IMU. Riprova più tardi.');
  }
}

/**
 * Utility per ottenere le rate semestrali dell'IMU
 */
export function getRateSemestrali(imuTotale: number): { prima_rata: number; seconda_rata: number; scadenze: { prima: string; seconda: string } } {
  const primaRata = Number((imuTotale * 0.5).toFixed(2));
  const secondaRata = Number((imuTotale - primaRata).toFixed(2));
  
  return {
    prima_rata: primaRata,
    seconda_rata: secondaRata,
    scadenze: {
      prima: '16 giugno',
      seconda: '16 dicembre'
    }
  };
} 