import { db } from "../../services/supabase";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Switch, View } from "react-native";
import {
  Screen,
  Copy,
  Field,
  PrimaryButton,
  ErrorState,
  Card,
} from "../../components/ui";
import { AppHeader, CategoryChips, PlaceCard } from "../../components/design";
import { PhotoPicker } from "../../components/photos";
import { addPlace, type Place } from "../../services/catalog";
export default function Add() {
  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
  }>();
  const [form, setForm] = useState({
    name: "",
    category: "Comer",
    city: "",
    state: "",
    address: "",
    description: "",
  });
  const [manualLatitude, setLatitude] = useState<string>();
  const latitude = manualLatitude ?? params.latitude ?? "";
  const [manualLongitude, setLongitude] = useState<string>();
  const longitude = manualLongitude ?? params.longitude ?? "";
  const [isPublic, setPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [created, setCreated] = useState("");
  const [duplicates, setDuplicates] = useState<Place[] | null>(null);
  async function check() {
    setBusy(true);
    setError(undefined);
    try {
      const r = await db().rpc("duplicate_candidates", {
        term: form.name,
        city_input: form.city,
        state_input: form.state,
      });
      if (r.error) throw r.error;
      setDuplicates(r.data);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    setError(undefined);
    setBusy(true);
    try {
      const id = await addPlace({
        ...form,
        is_public_venue: isPublic,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      });
      setCreated(id);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <AppHeader title="Adicionar um lugar" />
      <Copy>
        Pesquise antes de cadastrar. Não publique residências privadas nem dados
        pessoais de terceiros.
      </Copy>
      <Field
        label="Nome do lugar"
        value={form.name}
        onChangeText={(name) => {
          setForm({ ...form, name });
          setDuplicates(null);
        }}
      />
      <CategoryChips
        value={form.category}
        onChange={(category) => {
          if (category !== "Todos") setForm({ ...form, category });
        }}
      />
      {(["city", "state", "address", "description"] as const).map((key, i) => (
        <Field
          key={key}
          label={
            ["Cidade", "UF", "Endereço público", "Descrição (opcional)"][i]
          }
          value={form[key]}
          onChangeText={(v) => {
            setForm({ ...form, [key]: key === "state" ? v.toUpperCase() : v });
            setDuplicates(null);
          }}
          multiline={key === "description"}
          maxLength={key === "state" ? 2 : key === "description" ? 1000 : 240}
        />
      ))}
      <PrimaryButton
        title="Pesquisar possíveis duplicatas"
        disabled={busy || form.name.length < 3 || !form.city || !form.state}
        onPress={() => void check()}
      />
      {duplicates?.length === 0 && (
        <Copy>
          Nenhum candidato público encontrado. O servidor também verifica
          cadastros pendentes.
        </Copy>
      )}
      {duplicates?.map((p) => (
        <PlaceCard key={p.id} place={p} />
      ))}
      <Card>
        <Copy>
          Posição opcional: informe coordenadas ou selecione no mapa. O endereço
          permanece disponível para busca manual.
        </Copy>
        <Field
          label="Latitude"
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numbers-and-punctuation"
        />
        <Field
          label="Longitude"
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numbers-and-punctuation"
        />
        <PrimaryButton
          title="Selecionar posição no mapa"
          onPress={() =>
            router.push({ pathname: "/map", params: { pick: "1" } })
          }
        />
      </Card>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Switch
          accessibilityLabel="Confirmo que é estabelecimento público"
          value={isPublic}
          onValueChange={setPublic}
        />
        <View style={{ flex: 1 }}>
          <Copy>
            Confirmo que é um estabelecimento público, não uma residência
            privada.
          </Copy>
        </View>
      </View>
      {error != null && <ErrorState error={error} />}
      {created ? (
        <Card>
          <Copy>Cadastro recebido. Pendente de revisão; não está público.</Copy>
          <PhotoPicker placeId={created} />
        </Card>
      ) : (
        <PrimaryButton
          title="Enviar para revisão"
          disabled={busy || !isPublic || duplicates === null}
          onPress={() => void submit()}
        />
      )}
    </Screen>
  );
}
