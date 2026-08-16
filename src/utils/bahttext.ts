/**
 * Converts a numeric Thai Baht value into Thai Baht Text string representation.
 * Example: 1500.50 -> "หนึ่งพันห้าร้อยบาทห้าสิบสตางค์"
 * Example: 85000 -> "แปดหมื่นห้าพันบาทถ้วน"
 */

const THAI_NUMBERS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_UNITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function convertGroup(numStr: string): string {
  let result = '';
  const len = numStr.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr.charAt(i), 10);
    const unitIndex = len - 1 - i;

    if (digit !== 0) {
      if (unitIndex === 1 && digit === 1) {
        // "สิบ" instead of "หนึ่งสิบ"
        result += 'สิบ';
      } else if (unitIndex === 1 && digit === 2) {
        // "ยี่สิบ" instead of "สองสิบ"
        result += 'ยี่สิบ';
      } else if (unitIndex === 0 && digit === 1 && len > 1) {
        // "เอ็ด" at the last position if group > 1 digit
        result += 'เอ็ด';
      } else {
        result += THAI_NUMBERS[digit] + THAI_UNITS[unitIndex];
      }
    }
  }

  return result;
}

export function bahtText(num: number | string): string {
  const numberVal = typeof num === 'string' ? parseFloat(num) : num;

  if (isNaN(numberVal) || numberVal === null || numberVal === undefined) {
    return 'ศูนย์บาทถ้วน';
  }

  // Round to 2 decimal places
  const rounded = Math.round(Math.abs(numberVal) * 100) / 100;
  if (rounded === 0) {
    return 'ศูนย์บาทถ้วน';
  }

  const parts = rounded.toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let bahtStr = '';

  // Process integer part in chunks of 6 digits (millions)
  let remainingInt = integerPart;
  const chunks: string[] = [];

  while (remainingInt.length > 0) {
    if (remainingInt.length <= 6) {
      chunks.unshift(remainingInt);
      break;
    } else {
      chunks.unshift(remainingInt.slice(-6));
      remainingInt = remainingInt.slice(0, -6);
    }
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = convertGroup(chunks[i]);
    bahtStr += chunkText;
    if (i < chunks.length - 1 && chunkText.length > 0) {
      bahtStr += 'ล้าน';
    }
  }

  if (bahtStr.length === 0) {
    bahtStr = 'ศูนย์';
  }

  bahtStr += 'บาท';

  // Process decimal part
  const satangVal = parseInt(decimalPart, 10);
  if (satangVal === 0) {
    bahtStr += 'ถ้วน';
  } else {
    bahtStr += convertGroup(decimalPart) + 'สตางค์';
  }

  if (numberVal < 0) {
    return 'ลบ' + bahtStr;
  }

  return bahtStr;
}
