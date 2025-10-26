/**
 * Generate QR code using a web-based QR code generator
 * This approach doesn't require additional npm packages
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    // Use qr-server.com API to generate QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
    
    // Convert to base64 for storage
    const response = await fetch(qrUrl);
    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate QR data for ticket
 */
export function generateTicketQRData(orderId: string, orderItemId: string, productName: string): string {
  const qrData = {
    orderId,
    orderItemId,
    productName,
    timestamp: new Date().toISOString(),
    type: 'ticket'
  };
  
  return JSON.stringify(qrData);
}
