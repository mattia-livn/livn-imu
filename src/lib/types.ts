// Tipi per gli immobili
export interface Immobile {
  id: string;
  indirizzo: string;
  citta: string;  // Cambio da 'comune' a 'citta' per compatibilità con la tabella
  provincia: string;
  categoria: string;
  rendita: number;
  abitazione_principale: boolean;
  tipo_contratto: TipoContratto;
  pertinenza: boolean;
  pertinenza_di: string | null;
}

// Tipi per i contratti di locazione
export type TipoContratto = 
  | "libero" 
  | "concordato" 
  | "transitorio" 
  | "studenti" 
  | "comodato_parenti" 
  | "none";

// Tipi per le aliquote IMU da Supabase
export interface AliquotaIMU {
  id: number;
  anno: number;
  comune: string;
  provincia: string;
  categoria: string;
  percentuale_abitazione_principale: number;
  percentuale_abitazione_principale_lusso: number;
  percentuale_default: number;
  percentuale_locato_libero: number;
  percentuale_locato_concordato: number;
  percentuale_locato_transitorio: number;
  percentuale_locato_studenti: number;
  percentuale_comodato_parenti: number;
}

// Input per calcolo singolo immobile
export interface InputCalcoloIMU {
  anno: number;
  citta: string;  // Cambio da 'comune' a 'citta'
  provincia: string;
  categoria: string;
  rendita: number;
  abitazione_principale: boolean;
  tipo_contratto: TipoContratto;
}

// Output per calcolo singolo immobile
export interface OutputCalcoloIMU {
  aliquota_utilizzata: number;
  base_imponibile: number;
  imu_calcolata: number;
}

// Output per calcolo progetto completo
export interface OutputCalcoloProgetto {
  imu_totale: number;
  dettaglio_per_immobile: Array<{
    id: string;
    aliquota_utilizzata: number;
    base_imponibile: number;
    imu_calcolata: number;
  }>;
}

// Dati estratti da visura catastale
export interface DatiVisura {
  indirizzo: string;
  comune: string;
  provincia: string;
  categoria: string;
  rendita: number;
} 