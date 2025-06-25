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
const EXTRACTION_PROMPT = `Sei un assistente specializzato nell'estrazione di dati da visure catastali italiane.
Il tuo compito è estrarre TUTTI gli immobili presenti nella visura e per ognuno estrarre i seguenti dati:

- indirizzo dell'immobile
- nome del comune  
- provincia (due lettere)
- categoria catastale (es. A/2, C/6, ecc.)
- rendita catastale (solo rendita catastale, in euro)

IMPORTANTE: Devi restituire SOLO un oggetto JSON valido, senza alcun testo di spiegazione, commenti o formattazione Markdown.
Il formato deve essere esattamente:

{
  "immobili": [
    {
      "indirizzo": "...",
      "comune": "...",
      "provincia": "...",
      "categoria": "...",
      "rendita": ...
    }
  ]
}

NON aggiungere alcun testo prima o dopo il JSON. NON usare formattazione Markdown. NON includere \`\`\`json o altri delimitatori.`;

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
      // Rimuovi eventuali backtick, indicatori di codice e testo esplicativo
      const cleanResponse = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^[^{]*/g, '') // Rimuove tutto il testo prima della prima parentesi graffa
        .replace(/}[^}]*$/g, '}') // Mantiene solo l'ultima parentesi graffa
        .trim();
      
      console.log('🧹 Risposta pulita:', cleanResponse);
      
      const data = JSON.parse(cleanResponse) as VisuraData;
      
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