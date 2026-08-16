/**
 * Thai PromptPay QR EMVCo Standard Payload Generator (National ITMX / Bank of Thailand)
 * Supports Mobile Phone Number, National ID / Tax ID, and E-Wallet ID with dynamic amount.
 */

// CRC-16/CCITT-FALSE (Polynomial 0x1021, Init 0xFFFF)
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  // Sanitize target
  const sanitized = target.replace(/[^0-9]/g, '');

  if (!sanitized) {
    return '';
  }

  // Determine target type (Phone vs National/Tax ID vs E-Wallet)
  let subTag = '';
  if (sanitized.length === 10 && sanitized.startsWith('0')) {
    // Mobile Phone (e.g. 0812345678 -> 0066812345678)
    const formattedPhone = `0066${sanitized.substring(1)}`;
    subTag = formatTag('01', formattedPhone);
  } else if (sanitized.length === 13) {
    // National ID or Tax ID (13 digits)
    subTag = formatTag('02', sanitized);
  } else if (sanitized.length === 15) {
    // E-Wallet ID
    subTag = formatTag('03', sanitized);
  } else {
    // Default fallback to 01 phone or 02 ID
    if (sanitized.startsWith('0')) {
      const formattedPhone = `0066${sanitized.substring(1)}`;
      subTag = formatTag('01', formattedPhone);
    } else {
      subTag = formatTag('02', sanitized);
    }
  }

  // Tag 29 - Merchant Account Information (PromptPay)
  // AID: A000000677010111
  const aidTag = formatTag('00', 'A000000677010111');
  const merchantAccount = formatTag('29', `${aidTag}${subTag}`);

  // Base EMVCo tags
  let payload = '';
  payload += formatTag('00', '01'); // Payload Format Indicator
  payload += formatTag('01', amount && amount > 0 ? '12' : '11'); // 12 = Dynamic (with amount), 11 = Static
  payload += merchantAccount;
  payload += formatTag('53', '764'); // Currency = THB (764)

  // Tag 54 - Amount
  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += formatTag('54', formattedAmount);
  }

  payload += formatTag('58', 'TH'); // Country Code = TH

  // Tag 63 - CRC16 Checksum
  const preCrc = `${payload}6304`;
  const crc = crc16(preCrc);
  return `${preCrc}${crc}`;
}
