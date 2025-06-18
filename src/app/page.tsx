import { ImmoiliManager } from '@/components/immobili-manager';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestione Immobili IMU
          </h1>
          <p className="text-gray-600">
            Inserisci i dati dei tuoi immobili manualmente o carica le visure catastali per l&apos;estrazione automatica
          </p>
        </div>
        <ImmoiliManager />
      </main>
    </div>
  );
}
