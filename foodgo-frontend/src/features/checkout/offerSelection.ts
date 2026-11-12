import type { Offer, PaymentMethod } from '../../shared/types/domain.ts';
import { offerProblem } from './checkoutFlow.ts';

export function offerGroups(offers: Offer[], search: string, subtotal: number, method: PaymentMethod, restaurantId: string) {
  const query = search.trim().toLocaleLowerCase('vi');
  const matches = offers.filter(offer => `${offer.code} ${offer.name}`.toLocaleLowerCase('vi').includes(query));
  return {
    available: matches.filter(offer => !offerProblem(offer, subtotal, method, restaurantId)),
    unavailable: matches.filter(offer => !!offerProblem(offer, subtotal, method, restaurantId)),
  };
}
