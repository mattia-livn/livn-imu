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
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default;
    
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
    try {
      // Cerca di trovare l'inizio del JSON nella risposta
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('JSON non trovato nella risposta');
      }
      
      const jsonString = responseText.substring(jsonStart, jsonEnd + 1);
      const data = JSON.parse(jsonString) as VisuraData;
      
      // Valida i dati estratti
      if (!data.immobili || !Array.isArray(data.immobili)) {
        throw new Error('Formato dati non valido');
      }

      console.log('🎯 Estrazione completata con successo:', data);
      
      return data;
    } catch (error) {
      console.error('Errore nel parsing della risposta OpenAI:', responseText);
      throw new Error('Formato di risposta non valido da OpenAI');
    }
  } catch (error) {
    console.error('❌ Errore nell\'estrazione della visura:', error);
    throw error;
  }
} 