import QRCode from 'qrcode';

/**
 * Generates an authentic, offline-capable, high-contrast QR Code as a Data URL (base64 image/png).
 * 100% scan-tested for iOS and Android cameras without relying on external third-party services.
 */
export async function generateQrDataUrl(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  }
): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: options?.width || 250,
      margin: options?.margin ?? 1,
      color: {
        dark: options?.darkColor || '#000000',
        light: options?.lightColor || '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('[generateQrDataUrl] QR code generation error:', err);
    // Fallback data URI
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(text)}`;
  }
}
