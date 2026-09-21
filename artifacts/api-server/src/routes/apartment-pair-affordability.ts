type RentPair = {
  id: string;
  combinedMonthlyRentEur: number | null;
  paper: { monthlyRentEur: number | null };
  apartment: { monthlyRentEur: number | null };
};

export function validatePairAffordability(pair: RentPair, softMaxEur: number, hasException: boolean): string[] {
  const errors: string[] = [];
  const leftRent = pair.paper.monthlyRentEur;
  const rightRent = pair.apartment.monthlyRentEur;

  if (leftRent === null || rightRent === null) {
    errors.push(`${pair.id} cannot qualify without source-quoted rent for both apartments`);
  }

  if (pair.combinedMonthlyRentEur === null || pair.combinedMonthlyRentEur <= 0) {
    errors.push(`${pair.id} must have a positive combined monthly rent`);
  } else if (pair.combinedMonthlyRentEur > softMaxEur && !hasException) {
    errors.push(`${pair.id} exceeds €${softMaxEur} without a documented budget exception`);
  }

  if (
    leftRent !== null &&
    rightRent !== null &&
    pair.combinedMonthlyRentEur !== null &&
    Math.abs(leftRent + rightRent - pair.combinedMonthlyRentEur) > 0.01
  ) {
    errors.push(`${pair.id} combined rent does not equal its apartment rents`);
  }

  return errors;
}