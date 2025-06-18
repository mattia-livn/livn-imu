import OpenAI from 'openai';

// Tipo per un singolo immobile estratto
export interface ImmobileData {
  indirizzo: string;
  comune: string;
  provincia: string;
  categoria: string;
  rendita: number;
}

// Tipo per la risposta dell'estrazione (array di immobili)
export interface VisuraData {
  immobili: ImmobileData[];
}

// Inizializza OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Prompt per l'estrazione dei dati
const EXTRACTION_PROMPT = `Ti invio il contenuto testuale di una visura catastale italiana.  
Estrai TUTTI gli immobili presenti nella visura e per ognuno estrai i seguenti dati:

- indirizzo dell'immobile
- nome del comune  
- provincia (due lettere)
- categoria catastale (es. A/2, C/6, ecc.)
- rendita catastale (solo rendita catastale, in euro)

Il formato di output deve essere esclusivamente un JSON con array di immobili:

{
  "immobili": [
    {
      "indirizzo": "...",
      "comune": "...",
      "provincia": "...",
      "categoria": "...",
      "rendita": ...
    },
    {
      "indirizzo": "...",
      "comune": "...",
      "provincia": "...",
      "categoria": "...",
      "rendita": ...
    }
  ]
}

Anche se c'è un solo immobile, restituisci sempre un array. Non includere testo di spiegazione o commenti. Solo JSON puro.`;

/**
 * Estrae i dati catastali da un PDF di visura
 * @param pdfBuffer Buffer del file PDF
 * @returns Oggetto con i dati estratti
 */
export async function extractVisuraData(pdfBuffer: Buffer): Promise<VisuraData> {
  try {
    console.log('🔍 Inizio estrazione PDF...');
    
    // Importa pdf-parse senza richiedere file esterni
    const pdfParse = require('pdf-parse');
    
    // Estrai il testo dal PDF
    const data = await pdfParse(pdfBuffer);
    const textContent = data.text;

    console.log('📄 Testo estratto (primi 500 caratteri):', textContent.substring(0, 500));

    if (!textContent || textContent.trim().length === 0) {
      throw new Error('Impossibile estrarre testo dal PDF');
    }

    console.log('🤖 Invio richiesta a OpenAI...');

    // Verifica che la chiave OpenAI sia configurata
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Chiave API OpenAI non configurata. Controllare .env.local');
    }

    // Invia il testo a OpenAI per l'estrazione strutturata
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: EXTRACTION_PROMPT,
        },
        {
          role: 'user',
          content: `Ecco il contenuto della visura catastale:\n\n${textContent}`,
        },
      ],
      temperature: 0,
      max_tokens: 500,
    });

    console.log('✅ Risposta ricevuta da OpenAI');

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('Nessuna risposta ricevuta da OpenAI');
    }

    console.log('📋 Risposta OpenAI:', responseText);

    // Prova a parsare la risposta JSON
    let extractedData: VisuraData;
    try {
      extractedData = JSON.parse(responseText.trim());
    } catch {
      console.error('Errore nel parsing della risposta OpenAI:', responseText);
      throw new Error('Formato di risposta non valido da OpenAI');
    }

    // Valida i dati estratti
    if (!extractedData.immobili || !Array.isArray(extractedData.immobili) || extractedData.immobili.length === 0) {
      throw new Error('Nessun immobile trovato nella visura');
    }

    // Valida ogni immobile
    for (const immobile of extractedData.immobili) {
      if (!immobile.indirizzo || !immobile.comune || !immobile.provincia || 
          !immobile.categoria || typeof immobile.rendita !== 'number') {
        throw new Error('Dati di un immobile incompleti o non validi');
      }
    }

    console.log('🎯 Estrazione completata con successo:', extractedData);
    return extractedData;
  } catch (error) {
    console.error('❌ Errore nell\'estrazione della visura:', error);
    throw error;
  }
} 