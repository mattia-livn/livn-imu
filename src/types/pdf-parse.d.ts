declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PDFParseOptions {
    max?: number;
    version?: string;
  }

  interface PDFParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: PDFParseOptions): Promise<PDFParseResult>;
  export default pdfParse;
} 