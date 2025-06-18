'use client';

import React, { useState } from 'react';
import { Mail, FileText, Send, Check, AlertCircle } from 'lucide-react';

interface ReportBannerProps {
  risultatoIMU: { imu_totale: number; dettaglio_per_immobile: Array<{ id: string; aliquota_utilizzata: number; base_imponibile: number; imu_calcolata: number; }> };
  immobili: Array<{ id: string; indirizzo: string; citta: string; provincia: string; categoria: string; rendita: number; }>;
  onClose?: () => void;
}

export function ReportBanner({ risultatoIMU, immobili, onClose }: ReportBannerProps) {
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    if (!email || !email.includes('@')) {
      setError('Inserisci un indirizzo email valido');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          risultatoIMU,
          immobili
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante la generazione del report');
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setEmail('');
        onClose?.();
      }, 3000);

    } catch (error) {
      console.error('Errore invio report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      
      // Messaggio più user-friendly per errori di configurazione
      if (errorMessage.includes('Configurazione email mancante')) {
        setError('⚙️ Sistema email non configurato. Contatta l\'amministratore per abilitare l\'invio report.');
      } else if (errorMessage.includes('Missing credentials')) {
        setError('⚙️ Credenziali email non valide. Contatta l\'amministratore.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-green-900">
              ✅ Report inviato con successo!
            </h3>
            <p className="text-green-700 mt-1">
              Il report PDF è stato inviato alla tua email. Controlla anche la cartella spam.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📄 Vuoi un report dettagliato del calcolo?
          </h3>
          
          <p className="text-blue-700 mb-4">
            Ricevi via email un report PDF completo con tutti i dettagli del calcolo IMU, 
            le aliquote applicate e le scadenze di pagamento.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Inserisci la tua email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isGenerating}
                />
              </div>
              {error && (
                <div className="flex items-center mt-2 text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
            
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || !email}
              className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Invia Report
                </>
              )}
            </button>
          </div>
          
          <div className="mt-3 text-sm text-blue-600">
            💡 Il report includerà: dati immobili, aliquote, calcoli dettagliati e scadenze
          </div>
          <div className="mt-2 text-xs text-gray-500">
            📧 Per abilitare l'invio email è necessario configurare RESEND_API_KEY nel file .env.local
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
} 