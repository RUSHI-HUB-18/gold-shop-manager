export interface CalculationInput {
  weight: number;
  makingCharge: number;
  goldRate: number;
  gstPercentage: number;
}

export interface CalculationResult {
  goldValue: number;
  makingCharges: number;
  subtotal: number;
  gstAmount: number;
  finalAmount: number;
}

export const calculatorService = {
  calculate(input: CalculationInput): CalculationResult {
    const { weight, makingCharge, goldRate, gstPercentage } = input;
    
    const goldValue = weight * goldRate;
    const makingCharges = weight * makingCharge;
    const subtotal = goldValue + makingCharges;
    const gstAmount = subtotal * (gstPercentage / 100);
    const finalAmount = subtotal + gstAmount;

    return {
      goldValue: Math.round(goldValue * 100) / 100,
      makingCharges: Math.round(makingCharges * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100
    };
  }
};
