import { normalizeFilters, emptyFilters } from "./explore.ts";
export type PlaceDraft = {
  name: string;
  category: string;
  city: string;
  state: string;
  address: string;
  description: string;
};
export function validatePlaceStep(step: number, form: PlaceDraft) {
  if (step === 0) {
    if (form.name.trim().length < 3 || form.name.trim().length > 120)
      throw new Error("Informe o nome do lugar com pelo menos 3 caracteres.");
    if (!["Comer", "Lazer", "Compras", "Serviços"].includes(form.category))
      throw new Error("Escolha uma categoria para o lugar.");
    if (form.description.trim().length > 1000)
      throw new Error("Sua descrição pode ter até 1.000 caracteres.");
  }
  if (step === 1) {
    normalizeFilters({ ...emptyFilters, city: form.city, state: form.state });
    if (form.city.trim().length < 2 || !form.state.trim())
      throw new Error("Informe a cidade e a UF do lugar.");
    if (form.address.trim().length < 5)
      throw new Error(
        "Informe o endereço público, com rua e número quando houver.",
      );
  }
}
