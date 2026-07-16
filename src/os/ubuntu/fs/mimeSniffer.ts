export async function sniffMimeType(blob: Blob): Promise<string> {
  const buffer = await blob.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  if (bytes.length >= 4) {
    // 89 50 4E 47 - PNG
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
    // 47 49 46 38 - GIF
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif';
    // 25 50 44 46 - PDF
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf';
    // 52 49 46 46 - WEBP / AVI / WAV (requires further inspection, default to fallback)
    // 00 00 00 18 / 00 00 00 20 ... ftypmp42 - MP4
  }
  
  if (bytes.length >= 2) {
    // FF D8 - JPEG
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
  }

  // Fallback to type from blob or a generic octet-stream
  return blob.type || 'application/octet-stream';
}
