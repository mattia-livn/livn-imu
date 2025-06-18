import jsPDF from 'jspdf';
import { Immobile } from './types';

interface ReportData {
  immobili: Immobile[];
  risultatoIMU: any;
  dataGenerazione: Date;
}

export async function generateReportPDF(data: ReportData): Promise<Buffer> {
  const { immobili, risultatoIMU, dataGenerazione } = data;
  
  // Crea nuovo documento PDF
  const doc = new jsPDF();
  
  // Configurazione font e colori
  const primaryColor: [number, number, number] = [59, 130, 246]; // blu
  const secondaryColor: [number, number, number] = [107, 114, 128]; // grigio
  
  let yPosition = 20;
  
  // === HEADER ===
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text('Report Calcolo IMU 2025', 20, yPosition);
  
  yPosition += 15;
  doc.setFontSize(12);
  doc.setTextColor(...secondaryColor);
  doc.text(`Generato il: ${dataGenerazione.toLocaleDateString('it-IT')} alle ${dataGenerazione.toLocaleTimeString('it-IT')}`, 20, yPosition);
  
  yPosition += 20;
  
  // === RIEPILOGO TOTALE ===
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('💰 Riepilogo Totale', 20, yPosition);
  
  yPosition += 10;
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text(`IMU Totale 2025: €${risultatoIMU.imu_totale?.toFixed(2) || '0.00'}`, 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setTextColor(...secondaryColor);
  doc.text('• Prima rata (scadenza 16 giugno): €' + ((risultatoIMU.imu_totale || 0) / 2).toFixed(2), 25, yPosition);
  
  yPosition += 6;
  doc.text('• Seconda rata (scadenza 16 dicembre): €' + ((risultatoIMU.imu_totale || 0) / 2).toFixed(2), 25, yPosition);
  
  yPosition += 20;
  
  // === DETTAGLIO IMMOBILI ===
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('🏠 Dettaglio per Immobile', 20, yPosition);
  
  yPosition += 15;
  
  immobili.forEach((immobile, index) => {
    // Trova il dettaglio di calcolo per questo immobile
    const dettaglio = risultatoIMU.dettaglio_per_immobile?.find((d: any) => d.id === immobile.id) || {};
    
    // Intestazione immobile
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text(`Immobile ${index + 1}`, 20, yPosition);
    
    yPosition += 8;
    
    // Dati catastali
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`📍 Indirizzo: ${immobile.indirizzo}`, 25, yPosition);
    yPosition += 6;
    doc.text(`🏛️ Comune: ${immobile.citta} (${immobile.provincia})`, 25, yPosition);
    yPosition += 6;
    doc.text(`📋 Categoria: ${immobile.categoria}`, 25, yPosition);
    yPosition += 6;
    doc.text(`💰 Rendita Catastale: €${immobile.rendita.toFixed(2)}`, 25, yPosition);
    yPosition += 6;
    
    // Configurazione fiscale
    const configurazioni = [];
    if (immobile.abitazione_principale) configurazioni.push('🏠 Abitazione Principale');
    if (immobile.pertinenza) configurazioni.push('🚗 Pertinenza');
    if (immobile.tipo_contratto !== 'none') {
      const contratti = {
        'libero': '📄 Locazione Libera',
        'concordato': '📋 Locazione Concordata', 
        'transitorio': '⏱️ Locazione Transitoria',
        'studenti': '🎓 Locazione Studenti',
        'comodato': '👨‍👩‍👧‍👦 Comodato Familiare'
      };
      configurazioni.push(contratti[immobile.tipo_contratto as keyof typeof contratti] || immobile.tipo_contratto);
    }
    
    if (configurazioni.length > 0) {
      doc.text(`⚙️ Configurazione: ${configurazioni.join(', ')}`, 25, yPosition);
      yPosition += 6;
    }
    
    // Calcolo IMU
    doc.setTextColor(...primaryColor);
    doc.text(`💸 Aliquota Applicata: ${((dettaglio.aliquota_utilizzata || 0) * 100).toFixed(3)}%`, 25, yPosition);
    yPosition += 6;
    doc.text(`📊 Base Imponibile: €${dettaglio.base_imponibile?.toFixed(2) || '0.00'}`, 25, yPosition);
    yPosition += 6;
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 127); // rosa per evidenziare
    doc.text(`🎯 IMU Calcolata: €${dettaglio.imu_calcolata?.toFixed(2) || '0.00'}`, 25, yPosition);
    
    yPosition += 15;
    
    // Controlla se la pagina è piena
    if (yPosition > 260) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  // === FOOTER ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.text('Generato da Livn IMU - Sistema di Calcolo Imposte Immobiliari', 20, 285);
    doc.text(`Pagina ${i} di ${pageCount}`, 170, 285);
  }
  
  // Converti in Buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
} 