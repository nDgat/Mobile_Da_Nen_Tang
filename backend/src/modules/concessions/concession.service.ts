import { findActiveConcessions } from "./concession.repository.js";

export async function listConcessions() {
  const items = await findActiveConcessions();
  return items.map(item => ({ id: item.id, name: item.name, description: item.description, category: item.category, price: item.price.toString(), imageUrl: item.imageUrl }));
}
