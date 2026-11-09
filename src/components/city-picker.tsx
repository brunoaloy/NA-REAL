import { useState } from "react";
import { Keyboard, Modal } from "react-native";
import { CityFields } from "./city-fields";
import { Screen, PrimaryButton, ErrorState } from "./ui";
import { QuietButton, WarmIntro } from "./member-design";
import { preferredCity, type CityPreference } from "../validation/cities";
export function CityPicker({
  initial,
  onClose,
  onChoose,
}: {
  initial: CityPreference;
  onClose: () => void;
  onChoose: (city: CityPreference) => void;
}) {
  const [city, setCity] = useState(initial.city),
    [state, setState] = useState(initial.state),
    [error, setError] = useState<unknown>();
  function choose() {
    const value = preferredCity({ city, state });
    if (!value) {
      setError(new Error("Informe a cidade e uma UF válida para explorar."));
      return;
    }
    Keyboard.dismiss();
    onChoose(value);
  }
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <Screen>
        <WarmIntro
          eyebrow="SEU PRÓXIMO DESTINO"
          title="Qual cidade vamos descobrir?"
          body="Escolha a cidade para explorar o mapa e os lugares compartilhados pela comunidade."
        />
        <CityFields
          city={city}
          state={state}
          onCity={(v) => {
            setCity(v);
            setError(undefined);
          }}
          onState={(v) => {
            setState(v);
            setError(undefined);
          }}
          onSelect={(v) => {
            setCity(v.city);
            setState(v.state);
            setError(undefined);
          }}
        />
        {error != null && <ErrorState error={error} />}
        <PrimaryButton title="Explorar cidade" onPress={choose} />
        <QuietButton title="Cancelar escolha da cidade" onPress={onClose} />
      </Screen>
    </Modal>
  );
}
