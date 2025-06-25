import { createClient } from '@supabase/supabase-js';

// Tipi per i dati immobiliari
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

interface ConfigurazioneFiscale {
  aliquota_normale: number;
  aliquota_prima_casa: number;
  detrazione_prima_casa: number;
  moltiplicatore_categoria: Record<string, number>;
}

interface AliquoteIMU {
  '%_default': number;
  '%_abitazione_principale': number | null;
  '%_abitazione_principale_lusso': number;
  '%_locato_libero': number;
  '%_locato_concordato': number;
  '%_locato_transitorio': number;
  '%_locato_studenti': number;
  '%_comodato_parenti': number;
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

// Categorie di immobili di lusso
const CATEGORIE_LUSSO = ['A/1', 'A/8', 'A/9'];

// Categorie ammesse come pertinenze
const CATEGORIE_PERTINENZE = ['C/2', 'C/6', 'C/7'];

/**
 * Ottiene la configurazione fiscale per un comune dal database
 */
async function getConfigurazioneFiscale(provincia: string, citta: string): Promise<ConfigurazioneFiscale> {
  try {
    if (!supabase) {
      console.warn(`⚠️ Supabase non configurato - usando valori default per ${citta} (${provincia})`);
      return getConfigurazioneDefault();
    }

    const { data, error } = await supabase
      .from('imu_aliquote')
      .select('"%_default", "%_abitazione_principale", "%_abitazione_principale_lusso", "%_locato_libero", "%_locato_concordato", "%_locato_transitorio", "%_locato_studenti", "%_comodato_parenti"')
      .eq('provincia', provincia.toUpperCase())
      .ilike('comune', citta)
      .limit(1)
      .single();

    if (error) {
      console.warn(`Errore ricerca aliquote per ${citta} (${provincia}):`, error);
      return getConfigurazioneDefault();
    }

    const aliquotes = data as AliquoteIMU;
    
    return {
      aliquota_normale: Number(aliquotes['%_default']) || 0.86,
      aliquota_prima_casa: Number(aliquotes['%_abitazione_principale']) || 0.4,
      detrazione_prima_casa: 200,
      moltiplicatore_categoria: MOLTIPLICATORI_CATASTALI
    };

  } catch (error) {
    console.error('Errore nel recupero aliquote:', error);
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
 * Determina l'aliquota da applicare in base alle caratteristiche dell'immobile
 */
function determinaAliquota(immobile: ImmobileInput, aliquotes: AliquoteIMU, immobili: ImmobileInput[]): number {
  // 1. Abitazione principale
  if (immobile.abitazione_principale) {
    if (CATEGORIE_LUSSO.includes(immobile.categoria)) {
      return Number(aliquotes['%_abitazione_principale_lusso']);
    }
    return Number(aliquotes['%_abitazione_principale'] || 0);
  }

  // 2. Pertinenza di abitazione principale
  if (immobile.pertinenza && immobile.pertinenza_di) {
    const abitazionePrincipale = immobili.find(i => i.id === immobile.pertinenza_di);
    
    // Verifica che sia effettivamente pertinenza di un'abitazione principale
    if (abitazionePrincipale?.abitazione_principale) {
      // Verifica che sia una categoria ammessa come pertinenza
      if (CATEGORIE_PERTINENZE.includes(immobile.categoria)) {
        // Trova tutte le pertinenze della stessa categoria per questa abitazione principale
        const pertinenzeStefaCategoria = immobili.filter(i => 
          i.pertinenza_di === immobile.pertinenza_di &&
          i.categoria === immobile.categoria
        );

        // Ordina per rendita decrescente
        pertinenzeStefaCategoria.sort((a, b) => b.rendita - a.rendita);

        // Se è la pertinenza con rendita più alta della sua categoria
        if (pertinenzeStefaCategoria[0]?.id === immobile.id) {
          // Applica stessa aliquota dell'abitazione principale
          if (CATEGORIE_LUSSO.includes(abitazionePrincipale.categoria)) {
            return Number(aliquotes['%_abitazione_principale_lusso']);
          }
          return Number(aliquotes['%_abitazione_principale'] || 0);
        }
      }
    }
  }

  // 3. Contratti di locazione
  if (immobile.tipo_contratto !== 'none') {
    const mappaAliquotes: Record<string, keyof AliquoteIMU> = {
      'libero': '%_locato_libero',
      'concordato': '%_locato_concordato',
      'transitorio': '%_locato_transitorio',
      'studenti': '%_locato_studenti',
      'comodato': '%_comodato_parenti'
    };

    const chiaveAliquota = mappaAliquotes[immobile.tipo_contratto];
    if (chiaveAliquota) {
      return Number(aliquotes[chiaveAliquota]);
    }
  }

  // 4. Default per tutti gli altri casi
  return Number(aliquotes['%_default']);
}

/**
 * Calcola l'IMU per un singolo immobile
 */
function calcolaIMUPerImmobile(
  immobile: ImmobileInput,
  configurazione: ConfigurazioneFiscale,
  aliquotes: AliquoteIMU,
  immobili: ImmobileInput[]
): RisultatoCalcoloImmobile {
  // 1. Calcolo base imponibile
  const moltiplicatore = configurazione.moltiplicatore_categoria[immobile.categoria] || 160;
  const baseImponibile = immobile.rendita * 1.05 * moltiplicatore;
  
  // 2. Determina aliquota da applicare
  const aliquotaPercentuale = determinaAliquota(immobile, aliquotes, immobili);
  
  // 3. Calcolo IMU base
  const imuBase = (baseImponibile * aliquotaPercentuale) / 100;
  
  // 4. Applicazione detrazione prima casa
  const detrazioneApplicata = (immobile.abitazione_principale && !CATEGORIE_LUSSO.includes(immobile.categoria)) 
    ? configurazione.detrazione_prima_casa 
    : 0;
  
  // 5. Calcolo IMU finale (minimo 0)
  const imuFinale = Math.max(0, imuBase - detrazioneApplicata);
  
  return {
    id: immobile.id,
    aliquota_utilizzata: aliquotaPercentuale,
    base_imponibile: baseImponibile,
    imu_calcolata: Number(imuFinale.toFixed(2)),
    detrazione_applicata: detrazioneApplicata,
    prima_casa: immobile.abitazione_principale
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
    
    // Crea una mappa delle configurazioni e aliquote per comune
    const configurazioniPerComune: Record<string, ConfigurazioneFiscale> = {};
    const aliquotePerComune: Record<string, AliquoteIMU> = {};
    
    for (const comuneKey of comuniUnique) {
      const [provincia, citta] = comuneKey.split('|');
      
      // Se Supabase non è configurato, usa i valori di default
      if (!supabase) {
        console.warn(`⚠️ Supabase non configurato - usando valori default per ${citta} (${provincia})`);
        configurazioniPerComune[comuneKey] = getConfigurazioneDefault();
        aliquotePerComune[comuneKey] = {
          '%_default': 0.86,
          '%_abitazione_principale': 0.4,
          '%_abitazione_principale_lusso': 0.6,
          '%_locato_libero': 1.06,
          '%_locato_concordato': 0.575,
          '%_locato_transitorio': 0.575,
          '%_locato_studenti': 0.575,
          '%_comodato_parenti': 1.06
        };
        continue;
      }
      
      // Ottieni i dati da Supabase
      const { data, error } = await supabase
        .from('imu_aliquote')
        .select('"%_default", "%_abitazione_principale", "%_abitazione_principale_lusso", "%_locato_libero", "%_locato_concordato", "%_locato_transitorio", "%_locato_studenti", "%_comodato_parenti"')
        .eq('provincia', provincia.toUpperCase())
        .ilike('comune', citta)
        .limit(1)
        .single();

      if (error) {
        console.warn(`Errore ricerca aliquote per ${citta} (${provincia}):`, error);
        configurazioniPerComune[comuneKey] = getConfigurazioneDefault();
        aliquotePerComune[comuneKey] = {
          '%_default': 0.86,
          '%_abitazione_principale': 0.4,
          '%_abitazione_principale_lusso': 0.6,
          '%_locato_libero': 1.06,
          '%_locato_concordato': 0.575,
          '%_locato_transitorio': 0.575,
          '%_locato_studenti': 0.575,
          '%_comodato_parenti': 1.06
        };
        continue;
      }

      const aliquotes = data as AliquoteIMU;
      aliquotePerComune[comuneKey] = aliquotes;
      
      configurazioniPerComune[comuneKey] = {
        aliquota_normale: Number(aliquotes['%_default']) || 0.86,
        aliquota_prima_casa: Number(aliquotes['%_abitazione_principale']) || 0.4,
        detrazione_prima_casa: 200,
        moltiplicatore_categoria: MOLTIPLICATORI_CATASTALI
      };
    }
    
    // Calcola IMU per ogni immobile
    const dettaglioPerImmobile: RisultatoCalcoloImmobile[] = [];
    
    for (const immobile of immobili) {
      const comuneKey = `${immobile.provincia}|${immobile.citta}`;
      const configurazione = configurazioniPerComune[comuneKey];
      const aliquotes = aliquotePerComune[comuneKey];
      
      const risultatoImmobile = calcolaIMUPerImmobile(immobile, configurazione, aliquotes, immobili);
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