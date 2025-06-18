'use client';

import { useState } from 'react';
import { Immobile } from '../lib/types';

interface ImmobiliTableProps {
  immobili: Immobile[];
  onAdd: (immobile: Omit<Immobile, 'id'>) => void;
  onUpdate: (id: string, immobile: Omit<Immobile, 'id'>) => void;
  onDelete: (id: string) => void;
}

const CATEGORIE_CATASTALI = [
  'A/1', 'A/2', 'A/3', 'A/4', 'A/5', 'A/6', 'A/7', 'A/8', 'A/9', 'A/10', 'A/11',
  'B/1', 'B/2', 'B/3', 'B/4', 'B/5', 'B/6', 'B/7', 'B/8',
  'C/1', 'C/2', 'C/3', 'C/4', 'C/5', 'C/6', 'C/7',
  'D/1', 'D/2', 'D/3', 'D/4', 'D/5', 'D/6', 'D/7', 'D/8', 'D/9', 'D/10',
  'E/1', 'E/2', 'E/3', 'E/4', 'E/5', 'E/6', 'E/7', 'E/8', 'E/9',
  'F/1', 'F/2', 'F/3', 'F/4', 'F/5'
];

const PROVINCE_ITALIANE = [
  'AG', 'AL', 'AN', 'AO', 'AR', 'AP', 'AT', 'AV', 'BA', 'BT', 'BL', 'BN', 'BG', 'BI', 'BO', 'BZ', 'BS', 'BR',
  'CA', 'CL', 'CB', 'CI', 'CE', 'CT', 'CZ', 'CH', 'CO', 'CS', 'CR', 'KR', 'CN', 'EN', 'FM', 'FE', 'FI', 'FG',
  'FC', 'FR', 'GE', 'GO', 'GR', 'IM', 'IS', 'SP', 'AQ', 'LT', 'LE', 'LC', 'LI', 'LO', 'LU', 'MC', 'MN', 'MS',
  'MT', 'VS', 'ME', 'MI', 'MO', 'MB', 'NA', 'NO', 'NU', 'OG', 'OT', 'OR', 'PD', 'PA', 'PR', 'PV', 'PG', 'PU',
  'PE', 'PC', 'PI', 'PT', 'PN', 'PZ', 'PO', 'RG', 'RA', 'RC', 'RE', 'RI', 'RN', 'RM', 'RO', 'SA', 'SS', 'SV',
  'SI', 'SR', 'SO', 'TA', 'TE', 'TR', 'TO', 'TP', 'TN', 'TV', 'TS', 'UD', 'VA', 'VE', 'VB', 'VC', 'VR', 'VV',
  'VI', 'VT'
];

const TIPI_CONTRATTO = [
  { value: 'none', label: 'Non locato' },
  { value: 'libero', label: 'Locazione libera' },
  { value: 'concordato', label: 'Canone concordato' },
  { value: 'transitorio', label: 'Locazione transitoria' },
  { value: 'studenti', label: 'Locazione studenti' },
  { value: 'comodato_parenti', label: 'Comodato parenti' }
];

// Helper functions
const isAbitazione = (categoria: string) => {
  return categoria.startsWith('A/') && categoria !== 'A/10';
};

const isPertinenza = (categoria: string) => {
  return ['C/2', 'C/6', 'C/7'].includes(categoria);
};

const getAbitazioniInComune = (immobili: Immobile[], provincia: string, citta: string, excludeId?: string) => {
  return immobili.filter(immobile => 
    immobile.id !== excludeId &&
    immobile.provincia === provincia &&
    immobile.citta.toLowerCase() === citta.toLowerCase() &&
    isAbitazione(immobile.categoria)
  );
};

// Funzioni per gestire la condizione unificata
const getCondizioneDisplay = (immobile: Omit<Immobile, 'id'>) => {
  if (immobile.abitazione_principale) return 'abitazione_principale';
  if (immobile.pertinenza) return 'pertinenza';
  if (immobile.tipo_contratto !== 'none') return 'locato';
  return 'disponibile';
};

const getCondizioneOptions = (categoria: string) => {
  const options = [{ value: 'disponibile', label: 'Disponibile' }];
  
  if (isAbitazione(categoria)) {
    options.push({ value: 'abitazione_principale', label: 'Abitazione principale' });
  }
  
  if (isPertinenza(categoria)) {
    options.push({ value: 'pertinenza', label: 'Pertinenza' });
  }
  
  options.push({ value: 'locato', label: 'Locato' });
  
  return options;
};

const applyCondizione = (data: Omit<Immobile, 'id'>, condizione: string, dettaglio?: string) => {
  const result = { ...data };
  
  // Reset tutti i campi
  result.abitazione_principale = false;
  result.pertinenza = false;
  result.pertinenza_di = null;
  result.tipo_contratto = 'none';
  
  switch (condizione) {
    case 'abitazione_principale':
      result.abitazione_principale = true;
      break;
    case 'pertinenza':
      result.pertinenza = true;
      result.pertinenza_di = dettaglio || null;
      break;
    case 'locato':
      result.tipo_contratto = (dettaglio as Immobile['tipo_contratto']) || 'libero';
      break;
    case 'disponibile':
    default:
      // Già impostato sopra
      break;
  }
  
  return result;
};

export function ImmobiliTable({ immobili, onAdd, onUpdate, onDelete }: ImmobiliTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Omit<Immobile, 'id'>>({
    indirizzo: '',
    citta: '',
    provincia: '',
    categoria: '',
    rendita: 0,
    tipo_contratto: 'none',
    abitazione_principale: false,
    pertinenza: false,
    pertinenza_di: null
  });
  const [newRowData, setNewRowData] = useState<Omit<Immobile, 'id'>>({
    indirizzo: '',
    citta: '',
    provincia: '',
    categoria: '',
    rendita: 0,
    tipo_contratto: 'none',
    abitazione_principale: false,
    pertinenza: false,
    pertinenza_di: null
  });

  const startEditing = (immobile: Immobile) => {
    setEditingId(immobile.id);
    setEditData({
      indirizzo: immobile.indirizzo,
      citta: immobile.citta,
      provincia: immobile.provincia,
      categoria: immobile.categoria,
      rendita: immobile.rendita,
      tipo_contratto: immobile.tipo_contratto,
      abitazione_principale: immobile.abitazione_principale,
      pertinenza: immobile.pertinenza,
      pertinenza_di: immobile.pertinenza_di
    });
  };

  const validateAndAdjustData = (data: Omit<Immobile, 'id'>, currentId?: string) => {
    const adjusted = { ...data };

    // Se non è un'abitazione, non può essere abitazione principale
    if (!isAbitazione(adjusted.categoria)) {
      adjusted.abitazione_principale = false;
    }

    // Se è abitazione principale, non può essere locato (deve essere "none")
    if (adjusted.abitazione_principale) {
      adjusted.tipo_contratto = 'none';
    }

    // Se è locato (tipo_contratto != "none"), non può essere abitazione principale
    if (adjusted.tipo_contratto !== 'none') {
      adjusted.abitazione_principale = false;
    }

    // Se non è una pertinenza, rimuovi la relazione
    if (!isPertinenza(adjusted.categoria)) {
      adjusted.pertinenza = false;
      adjusted.pertinenza_di = null;
    }

    // Se è marcato come pertinenza ma non è una categoria pertinenza, rimuovi il flag
    if (adjusted.pertinenza && !isPertinenza(adjusted.categoria)) {
      adjusted.pertinenza = false;
      adjusted.pertinenza_di = null;
    }

    // Se è marcato come abitazione principale, rimuovi il flag da tutti gli altri
    if (adjusted.abitazione_principale) {
      immobili.forEach(immobile => {
        if (immobile.id !== currentId && immobile.abitazione_principale) {
          onUpdate(immobile.id, { ...immobile, abitazione_principale: false });
        }
      });
    }

    return adjusted;
  };

  const saveEdit = () => {
    if (editingId && editData.indirizzo && editData.citta && editData.provincia && editData.categoria && editData.rendita > 0) {
      const adjustedData = validateAndAdjustData(editData, editingId);
      onUpdate(editingId, adjustedData);
      setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({
      indirizzo: '',
      citta: '',
      provincia: '',
      categoria: '',
      rendita: 0,
      tipo_contratto: 'none',
      abitazione_principale: false,
      pertinenza: false,
      pertinenza_di: null
    });
  };

  const addNewRow = () => {
    if (newRowData.indirizzo && newRowData.citta && newRowData.provincia && newRowData.categoria && newRowData.rendita > 0) {
      const adjustedData = validateAndAdjustData(newRowData);
      onAdd(adjustedData);
      setNewRowData({
        indirizzo: '',
        citta: '',
        provincia: '',
        categoria: '',
        rendita: 0,
        tipo_contratto: 'none',
        abitazione_principale: false,
        pertinenza: false,
        pertinenza_di: null
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'save' | 'add') => {
    if (e.key === 'Enter') {
      if (action === 'save') {
        saveEdit();
      } else {
        addNewRow();
      }
    } else if (e.key === 'Escape' && action === 'save') {
      cancelEdit();
    }
  };

  const updateNewRowData = (field: keyof Omit<Immobile, 'id'>, value: string | number | boolean | null) => {
    const updated = { ...newRowData, [field]: value };
    setNewRowData(validateAndAdjustData(updated));
  };

  const updateEditData = (field: keyof Omit<Immobile, 'id'>, value: string | number | boolean | null) => {
    const updated = { ...editData, [field]: value };
    setEditData(validateAndAdjustData(updated, editingId!));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Indirizzo
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Città
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prov.
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rendita (€)
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Condizione
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Riga per aggiungere nuovo immobile */}
            <tr className="bg-blue-50 border-2 border-blue-200">
              <td className="px-3 py-3">
                <input
                  type="text"
                  placeholder="Indirizzo..."
                  value={newRowData.indirizzo}
                  onChange={(e) => updateNewRowData('indirizzo', e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, 'add')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </td>
              <td className="px-3 py-3">
                <input
                  type="text"
                  placeholder="Città..."
                  value={newRowData.citta}
                  onChange={(e) => updateNewRowData('citta', e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, 'add')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </td>
              <td className="px-3 py-3">
                <select
                  value={newRowData.provincia}
                  onChange={(e) => updateNewRowData('provincia', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Prov.</option>
                  {PROVINCE_ITALIANE.map(provincia => (
                    <option key={provincia} value={provincia}>{provincia}</option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-3">
                <select
                  value={newRowData.categoria}
                  onChange={(e) => updateNewRowData('categoria', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Categ.</option>
                  {CATEGORIE_CATASTALI.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-3">
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={newRowData.rendita || ''}
                  onChange={(e) => updateNewRowData('rendita', parseFloat(e.target.value) || 0)}
                  onKeyDown={(e) => handleKeyPress(e, 'add')}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </td>
              <td className="px-3 py-3">
                <div className="space-y-1">
                  <select
                    value={getCondizioneDisplay(newRowData)}
                    onChange={(e) => {
                      const condizione = e.target.value;
                      if (condizione === 'locato') {
                        const adjusted = applyCondizione(newRowData, condizione, 'libero');
                        setNewRowData(adjusted);
                      } else {
                        const adjusted = applyCondizione(newRowData, condizione);
                        setNewRowData(adjusted);
                      }
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getCondizioneOptions(newRowData.categoria).map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  
                  {getCondizioneDisplay(newRowData) === 'locato' && (
                    <select
                      value={newRowData.tipo_contratto}
                      onChange={(e) => updateNewRowData('tipo_contratto', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {TIPI_CONTRATTO.filter(t => t.value !== 'none').map(tipo => (
                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                      ))}
                    </select>
                  )}
                  
                  {getCondizioneDisplay(newRowData) === 'pertinenza' && (
                    <select
                      value={newRowData.pertinenza_di || ''}
                      onChange={(e) => updateNewRowData('pertinenza_di', e.target.value || null)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Seleziona abitazione</option>
                      {getAbitazioniInComune(immobili, newRowData.provincia, newRowData.citta).map(abitazione => (
                        <option key={abitazione.id} value={abitazione.id}>
                          {abitazione.indirizzo}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </td>
              <td className="px-3 py-3 text-right">
                <button
                  onClick={addNewRow}
                  disabled={!newRowData.indirizzo || !newRowData.citta || !newRowData.provincia || !newRowData.categoria || newRowData.rendita <= 0}
                  className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Aggiungi immobile"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </td>
            </tr>

            {/* Righe esistenti */}
            {immobili.map((immobile) => (
              <tr key={immobile.id} className="hover:bg-gray-50">
                {editingId === immobile.id ? (
                  // Modalità editing
                  <>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={editData.indirizzo}
                        onChange={(e) => updateEditData('indirizzo', e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, 'save')}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={editData.citta}
                        onChange={(e) => updateEditData('citta', e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, 'save')}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={editData.provincia}
                        onChange={(e) => updateEditData('provincia', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {PROVINCE_ITALIANE.map(provincia => (
                          <option key={provincia} value={provincia}>{provincia}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={editData.categoria}
                        onChange={(e) => updateEditData('categoria', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CATEGORIE_CATASTALI.map(categoria => (
                          <option key={categoria} value={categoria}>{categoria}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editData.rendita}
                        onChange={(e) => updateEditData('rendita', parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => handleKeyPress(e, 'save')}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <select
                          value={getCondizioneDisplay(editData)}
                          onChange={(e) => {
                            const condizione = e.target.value;
                            const adjusted = applyCondizione(editData, condizione);
                            setEditData(adjusted);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {getCondizioneOptions(editData.categoria).map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        
                        {getCondizioneDisplay(editData) === 'locato' && (
                          <select
                            value={editData.tipo_contratto}
                            onChange={(e) => updateEditData('tipo_contratto', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {TIPI_CONTRATTO.filter(t => t.value !== 'none').map(tipo => (
                              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                            ))}
                          </select>
                        )}
                        
                        {getCondizioneDisplay(editData) === 'pertinenza' && (
                          <select
                            value={editData.pertinenza_di || ''}
                            onChange={(e) => updateEditData('pertinenza_di', e.target.value || null)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Seleziona abitazione</option>
                            {getAbitazioniInComune(immobili, editData.provincia, editData.citta, editingId).map(abitazione => (
                              <option key={abitazione.id} value={abitazione.id}>
                                {abitazione.indirizzo}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={saveEdit}
                          className="text-green-600 hover:text-green-900 transition-colors p-1 rounded hover:bg-green-50"
                          title="Salva modifiche"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-900 transition-colors p-1 rounded hover:bg-gray-50"
                          title="Annulla modifiche"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // Modalità visualizzazione
                  <>
                    <td className="px-3 py-4 text-sm text-gray-900 cursor-pointer" onClick={() => startEditing(immobile)}>
                      {immobile.indirizzo}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 cursor-pointer" onClick={() => startEditing(immobile)}>
                      {immobile.citta}
                    </td>
                    <td className="px-3 py-4 cursor-pointer" onClick={() => startEditing(immobile)}>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {immobile.provincia}
                      </span>
                    </td>
                    <td className="px-3 py-4 cursor-pointer" onClick={() => startEditing(immobile)}>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {immobile.categoria}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900 cursor-pointer" onClick={() => startEditing(immobile)}>
                      € {immobile.rendita.toFixed(2)}
                    </td>
                    <td className="px-3 py-4 cursor-pointer" onClick={() => startEditing(immobile)}>
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          immobile.abitazione_principale ? 'bg-blue-100 text-blue-800' :
                          immobile.pertinenza ? 'bg-green-100 text-green-800' :
                          immobile.tipo_contratto !== 'none' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {immobile.abitazione_principale ? 'Abitazione principale' :
                           immobile.pertinenza ? 'Pertinenza' :
                           immobile.tipo_contratto !== 'none' ? 'Locato' :
                           'Disponibile'}
                        </span>
                        
                        {immobile.tipo_contratto !== 'none' && (
                          <div className="text-xs text-gray-600">
                            {TIPI_CONTRATTO.find(t => t.value === immobile.tipo_contratto)?.label}
                          </div>
                        )}
                        
                        {immobile.pertinenza && immobile.pertinenza_di && (
                          <div className="text-xs text-gray-600">
                            di: {immobili.find(i => i.id === immobile.pertinenza_di)?.indirizzo || 'Non trovato'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => startEditing(immobile)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                          title="Modifica immobile"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDelete(immobile.id)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                          title="Elimina immobile"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Messaggio quando non ci sono immobili */}
            {immobili.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center space-y-2">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Inizia inserendo i dati nella riga blu sopra o carica le visure catastali</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer con riepilogo */}
      {immobili.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Totale immobili: {immobili.length}
            </span>
            <span>
              Rendita totale: € {immobili.reduce((total, immobile) => total + immobile.rendita, 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 