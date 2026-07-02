interface ConvertOptions {
  currency?: 'INR';
  locale?: 'en-IN';
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertIndianLessThanThousand(num: number): string {
  let str = "";
  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 20) {
    str += TENS[Math.floor(num / 10)] + " ";
    num %= 10;
  }
  if (num > 0) {
    str += ONES[num] + " ";
  }
  return str.trim();
}

/**
 * Reusable utility to convert numbers into written words.
 * Currently optimized for Indian Locale (en-IN) and Rupees (INR).
 */
export function numberToWords(num: number, options: ConvertOptions = {}): string {
  const currency = options.currency || 'INR';
  
  if (num === 0) {
    return currency === 'INR' ? "Rupees Zero Only" : "Zero";
  }

  // Handle rounding to 2 decimal places to extract rupees and paise cleanly
  const formatted = Math.abs(num).toFixed(2);
  const [integerStr, decimalStr] = formatted.split('.');
  
  const integerPart = parseInt(integerStr, 10);
  const decimalPart = parseInt(decimalStr, 10);

  let words = "";

  if (integerPart > 0) {
    let temp = integerPart;
    
    // Crores (1,00,00,000)
    const crore = Math.floor(temp / 10000000);
    temp %= 10000000;
    
    // Lakhs (1,00,000)
    const lakh = Math.floor(temp / 100000);
    temp %= 100000;
    
    // Thousands (1,000)
    const thousand = Math.floor(temp / 1000);
    temp %= 1000;
    
    // Hundreds & units
    const units = temp;

    if (crore > 0) {
      words += convertIndianLessThanThousand(crore) + " Crore ";
    }
    if (lakh > 0) {
      words += convertIndianLessThanThousand(lakh) + " Lakh ";
    }
    if (thousand > 0) {
      words += convertIndianLessThanThousand(thousand) + " Thousand ";
    }
    if (units > 0) {
      words += convertIndianLessThanThousand(units) + " ";
    }
  }

  words = words.trim();

  if (currency === 'INR') {
    let result = "Rupees " + (words || "Zero");
    if (decimalPart > 0) {
      result += " and " + convertIndianLessThanThousand(decimalPart) + " Paise";
    }
    result += " Only";
    return result.replace(/\s+/g, ' ');
  } else {
    let result = words;
    if (decimalPart > 0) {
      result += " point " + convertIndianLessThanThousand(decimalPart);
    }
    return result.replace(/\s+/g, ' ').trim();
  }
}
