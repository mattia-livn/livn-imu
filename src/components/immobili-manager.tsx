'use client';

import { useState } from 'react';
import { Immobile } from '../lib/types';
import { FileUploadArea } from './file-upload-area';
import { ImmobiliTable } from './immobili-table';
import { ReportBanner } from './report-banner';

interface ImmobileData {
  indirizzo: string;
  comune: string;
  provincia: string;
  categoria: string;
  rendita: number;
}

interface VisuraData {
  immobili: ImmobileData[];
}

export function ImmoiliManager() {
  const [immobili, setImmobili] = useState<Immobile[]>([]);
  const [calcoloInCorso, setCalcoloInCorso] = useState(false);
  const [uploadInCorso, setUploadInCorso] = useState(false);
  const [risultatoIMU, setRisultatoIMU] = useState<any>(null);
  const [showReportBanner, setShowReportBanner] = useState(false);

  const handleAddImmobile = (immobile: Omit<Immobile, 'id'>) => {
    const newImmobile: Immobile = {
      ...immobile,
      id: Date.now().toString(),
    };
    setImmobili(prev => [...prev, newImmobile]);
  };

  const handleUpdateImmobile = (id: string, updatedImmobile: Omit<Immobile, 'id'>) => {
    setImmobili(prev => prev.map(immobile => 
      immobile.id === id 
        ? { ...updatedImmobile, id }
        : immobile
    ));
  };

  const handleDeleteImmobile = (id: string) => {
    setImmobili(prev => prev.filter(immobile => immobile.id !== id));
  };

  const handleFileUpload = async (file: File) => {
    console.log('File uploaded:', file);
    
    setUploadInCorso(true);
    
    try {
      // Crea FormData per l'API call
      const formData = new FormData();
      formData.append('pdf', file);
      
      // Chiama l'API di estrazione
      const response = await fetch('/api/extract-visura', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante l\'elaborazione');
      }
      
      // Estrai i dati dalla risposta
      const extractedData: VisuraData = await response.json();
      
      // Converti ogni immobile estratto nel formato della tabella
      const newImmobili: Immobile[] = extractedData.immobili.map((immobileData, index) => ({
        id: `ai-${Date.now()}-${index}-${Math.random()}`,
        indirizzo: immobileData.indirizzo,
        citta: immobileData.comune, // Mappo 'comune' a 'citta' per compatibilità
        provincia: immobileData.provincia,
        categoria: immobileData.categoria,
        rendita: immobileData.rendita,
        tipo_contratto: 'none' as const,
        abitazione_principale: false,
        pertinenza: false,
        pertinenza_di: null
      }));
      
      // Aggiungi tutti gli immobili alla lista
      setImmobili(prev => [...prev, ...newImmobili]);
      
      // Resetta l'upload dopo successo
      setTimeout(() => setUploadInCorso(false), 1000); // Breve delay per mostrare il completamento
    } catch (error) {
      console.error(`Errore nell'elaborazione del file ${file.name}:`, error);
      alert(`Errore nell'elaborazione del file: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
      setUploadInCorso(false);
    }
  };

  const handleCalcolaIMU = async () => {
    if (immobili.length === 0) {
      alert('Aggiungi almeno un immobile prima di calcolare l\'IMU');
      return;
    }

    setCalcoloInCorso(true);
    setRisultatoIMU(null);

    try {
      // Usa l'anno corrente per il calcolo
      const annoCorrente = new Date().getFullYear();
      const immobiliConAnno = immobili.map(immobile => ({
        ...immobile,
        anno: annoCorrente
      }));

      const response = await fetch('/api/calc-imu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'progetto',
          immobili: immobiliConAnno
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante il calcolo IMU');
      }

      const risultato = await response.json();
      setRisultatoIMU(risultato.risultato);
      setShowReportBanner(true); // Mostra il banner per il report

    } catch (error) {
      console.error('Errore nel calcolo IMU:', error);
      alert(`Errore nel calcolo IMU: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setCalcoloInCorso(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestione Immobili</h2>
          <p className="text-sm text-gray-600">
            {immobili.length} {immobili.length === 1 ? 'immobile' : 'immobili'} inseriti
          </p>
        </div>
      </div>

      {/* Area di upload file */}
      <FileUploadArea onFileUpload={handleFileUpload} isLoading={uploadInCorso} />

      {/* Tabella immobili interattiva */}
      <ImmobiliTable 
        immobili={immobili} 
        onAdd={handleAddImmobile}
        onUpdate={handleUpdateImmobile}
        onDelete={handleDeleteImmobile}
      />

      {/* Pulsante calcolo IMU */}
      {immobili.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={handleCalcolaIMU}
            disabled={calcoloInCorso}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {calcoloInCorso ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Calcolando IMU {new Date().getFullYear()}...
              </>
            ) : (
              <>
                💰 Calcola IMU {new Date().getFullYear()}
              </>
            )}
          </button>
        </div>
      )}

      {/* Risultati calcolo */}
      {risultatoIMU && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Risultato Calcolo IMU</h3>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="text-center">
                <p className="text-sm text-gray-600">IMU Totale {new Date().getFullYear()}</p>
                <p className="text-3xl font-bold text-green-600">€ {risultatoIMU.imu_totale.toFixed(2)}</p>
              </div>
            </div>
            
            {risultatoIMU.dettaglio_per_immobile && risultatoIMU.dettaglio_per_immobile.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-800">Dettaglio per immobile:</h4>
                {risultatoIMU.dettaglio_per_immobile.map((dettaglio: any, index: number) => {
                  const immobile = immobili.find(i => i.id === dettaglio.id);
                  return (
                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">
                            {immobile?.indirizzo || 'Immobile non trovato'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Aliquota: {(dettaglio.aliquota_utilizzata * 100).toFixed(2)}% • 
                            Base: € {dettaglio.base_imponibile.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">€ {dettaglio.imu_calcolata.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Banner Report - Posizionato DOPO i risultati */}
      {showReportBanner && risultatoIMU && (
        <ReportBanner 
          risultatoIMU={risultatoIMU}
          immobili={immobili}
          onClose={() => setShowReportBanner(false)}
        />
      )}
    </div>
  );
} 