import OpenAI from 'openai';
import pdfParse from 'pdf-parse';

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
    
    // Estrai il testo dal PDF
    console.log('📄 Inizio parsing PDF...');
    const data = await pdfParse(pdfBuffer);
    const textContent = data.text;
    console.log('📝 Lunghezza testo estratto:', textContent.length);
    console.log('📄 Testo estratto (primi 500 caratteri):', textContent.substring(0, 500));

    if (!textContent || textContent.trim().length === 0) {
      console.error('❌ Testo PDF vuoto o nullo');
      throw new Error('Impossibile estrarre testo dal PDF');
    }

    console.log('🤖 Verifica configurazione OpenAI...');
    // Verifica che la chiave OpenAI sia configurata
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Chiave API OpenAI non configurata');
      throw new Error('Chiave API OpenAI non configurata. Controllare .env.local');
    }
    console.log('✅ Configurazione OpenAI verificata');

    try {
      console.log('🤖 Invio richiesta a OpenAI...');
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
      console.log('📋 Risposta OpenAI:', completion.choices[0]?.message?.content);

      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        console.error('❌ Risposta OpenAI vuota o nulla');
        throw new Error('Nessuna risposta ricevuta da OpenAI');
      }

      console.log('📋 Risposta OpenAI:', responseText);

      // Prova a parsare la risposta JSON
      try {
        // Rimuovi eventuali backtick, indicatori di codice e testo esplicativo
        let cleanResponse = responseText
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        
        // Se la risposta inizia con testo, cerca il primo '{'
        const jsonStart = cleanResponse.indexOf('{');
        if (jsonStart > 0) {
          cleanResponse = cleanResponse.substring(jsonStart);
        }
        
        // Se la risposta ha testo dopo l'ultimo '}', rimuovilo
        const jsonEnd = cleanResponse.lastIndexOf('}');
        if (jsonEnd < cleanResponse.length - 1) {
          cleanResponse = cleanResponse.substring(0, jsonEnd + 1);
        }
        
        console.log('🧹 Risposta pulita:', cleanResponse);
        
        try {
          const data = JSON.parse(cleanResponse) as VisuraData;
          
          // Valida i dati estratti
          if (!data.immobili || !Array.isArray(data.immobili)) {
            console.error('❌ Dati non validi:', data);
            throw new Error('Formato dati non valido');
          }

          // Valida ogni immobile
          for (const immobile of data.immobili) {
            if (!immobile.indirizzo || !immobile.comune || !immobile.provincia || 
                !immobile.categoria || typeof immobile.rendita !== 'number') {
              console.error('❌ Immobile non valido:', immobile);
              throw new Error('Dati immobile non validi');
            }
          }

          console.log('🎯 Estrazione completata con successo:', data);
          
          return data;
        } catch (parseError) {
          console.error('❌ Errore nel parsing JSON:', parseError);
          throw new Error('Formato JSON non valido');
        }
      } catch (error) {
        console.error('❌ Errore nel processing della risposta OpenAI:', error);
        throw error;
      }
    } catch (openaiError) {
      console.error('❌ Errore specifico OpenAI:', openaiError);
      if (openaiError instanceof Error) {
        // Verifica se l'errore è dovuto alla chiave API
        if (openaiError.message.includes('API key')) {
          throw new Error('Errore di autenticazione OpenAI: controlla la chiave API');
        }
        // Verifica se l'errore è dovuto al modello non disponibile
        if (openaiError.message.includes('model')) {
          throw new Error('Errore con il modello GPT-4: verifica che sia abilitato per la tua chiave API');
        }
        // Altri errori OpenAI
        throw new Error(`Errore OpenAI: ${openaiError.message}`);
      }
      throw openaiError;
    }

  } catch (error) {
    console.error('❌ Errore durante l\'estrazione:', error);
    if (error instanceof Error) {
      console.error('Dettagli errore:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    throw error;
  }
} 