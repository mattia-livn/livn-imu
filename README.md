# Livn IMU Calculator

Un'applicazione web per il calcolo dell'IMU basata su Next.js e Supabase.

## Caratteristiche

- 📄 Upload e parsing automatico di visure catastali
- 🤖 Estrazione automatica dei dati degli immobili con OpenAI
- 💰 Calcolo IMU con gestione di:
  - Abitazione principale e pertinenze
  - Contratti di locazione (libero, concordato, transitorio, studenti)
  - Comodato d'uso gratuito a parenti
  - Aliquote specifiche per comune

## Requisiti

- Node.js 18.x o superiore
- Un account Supabase con database configurato
- Un account OpenAI per l'estrazione dei dati

## Configurazione

1. Clona il repository
```bash
git clone https://github.com/yourusername/livn-imu.git
cd livn-imu
```

2. Installa le dipendenze
```bash
npm install
```

3. Crea un file `.env.local` con le seguenti variabili:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_api_key
```

4. Avvia il server di sviluppo
```bash
npm run dev
```

## Struttura Database

Il database Supabase richiede una tabella `imu_aliquote` con la seguente struttura:
- `id`: bigint (primary key)
- `anno`: integer
- `comune`: text
- `provincia`: text
- `categoria`: text
- `%_default`: numeric
- `%_abitazione_principale`: numeric
- `%_abitazione_principale_lusso`: numeric
- `%_locato_libero`: numeric
- `%_locato_concordato`: numeric
- `%_locato_transitorio`: numeric
- `%_locato_studenti`: numeric
- `%_comodato_parenti`: numeric

## Deploy

L'app è ottimizzata per il deploy su Vercel. Per deployare:

1. Importa il repository su Vercel
2. Configura le variabili d'ambiente
3. Deploy!

## Licenza

MIT

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
