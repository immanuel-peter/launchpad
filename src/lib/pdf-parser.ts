/**
 * Parse PDF and extract text using pdf-parse-new with SmartPDFParser
 * Uses namespace import as recommended in the docs
 */
export async function parsePdf(buffer: Buffer) {
  // Use namespace import as recommended for TypeScript/ESM
  const PdfParse = await import("pdf-parse-new");
  
  // Use SmartPDFParser for automatic optimization based on PDF size
  const parser = new PdfParse.SmartPDFParser({
    oversaturationFactor: 1.5, // Better CPU utilization for I/O-bound parsing
    enableFastPath: true,       // 50x faster overhead for small PDFs
    enableCache: true,          // 25x faster on repeated similar PDFs
  });
  
  // Parse the PDF buffer
  const result = await parser.parse(buffer);
  
  // Return in the expected format with metadata
  return { 
    text: result.text,
    numpages: result.numpages,
    info: result.info,
    _meta: result._meta // Include parsing metadata (method used, duration, etc.)
  };
}
