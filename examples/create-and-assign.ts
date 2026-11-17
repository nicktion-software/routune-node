// npx tsx examples/create-and-assign.ts <customer_id> <pickup_location_id> <dropoff_location_id>
import Routune, { APIError } from '../src';

async function main() {
  const [customerId, pickupId, dropoffId] = process.argv.slice(2);
  if (!customerId || !pickupId || !dropoffId) {
    throw new Error('Usage: create-and-assign.ts <customer_id> <pickup_location_id> <dropoff_location_id>');
  }
  const routune = new Routune();

  const priceSet = (await routune.priceSets.list({ active: true, limit: 1 })).data[0];
  if (!priceSet) throw new Error('No active price set in this workspace.');

  const now = Date.now();
  const iso = (minutes: number) => new Date(now + minutes * 60_000).toISOString();

  const order = await routune.orders.create({
    customer_id: customerId,
    price_set_id: priceSet.id,
    gross_weight: 5,
    chargeable_weight: 5,
    reference_number: `example-${Date.now()}`,
    pickup: { location_id: pickupId, earliest_time: iso(30), latest_time: iso(90) },
    dropoff: { location_id: dropoffId, earliest_time: iso(120), latest_time: iso(240), signature_required: true },
  });
  console.log('created', order.id, order.number);

  const legs = (await routune.orders.retrieve(order.id)).legs ?? [];
  const driver = (await routune.drivers.list({ limit: 1 })).data[0];
  if (legs[0] && driver) {
    const assignment = await routune.orders.legs.assign(order.id, legs[0].id, { driver_id: driver.id });
    console.log('assigned', assignment.driver_id, 'to leg', assignment.leg_id);
  }
}

main().catch((err) => {
  if (err instanceof APIError) console.error(err.status, err.code, err.message, err.requestId);
  else console.error(err);
  process.exit(1);
});
