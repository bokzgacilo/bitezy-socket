import { Merchant } from '../models/merchant.model';

export async function registerMerchant(data: {
  name: string;
}) {
  const merchant = await Merchant.create(data);

  return merchant.get({ plain: true });
}
