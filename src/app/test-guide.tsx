import { router } from "expo-router";
import { useState } from "react";
import { Text, View, Pressable } from "react-native";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "../components/design";
import { Screen, Card, colors } from "../components/ui";
import {
  GentleNote,
  WarmIntro,
  QuietButton,
  m,
} from "../components/member-design";
const tasks = [
  "Encontrar um lugar pela cidade ou pelo mapa",
  "Salvar um favorito e abrir novamente",
  "Editar nome, descrição e foto do perfil",
  "Compartilhar um lugar e acompanhar a revisão",
  "Enviar uma avaliação e conferir com outra conta após aprovação",
];
export default function TestGuide() {
  const [done, setDone] = useState<number[]>([]);
  return (
    <Screen>
      <AppHeader title="Primeiros testes" back />
      <WarmIntro
        title="Vamos descobrir juntos?"
        body="Experimente estas tarefas e anote o que ficou difícil. Suas impressões ajudam a melhorar o NA REAL."
      />
      <GentleNote>
        Versão de teste {Constants.expoConfig?.version ?? "0.1.0"}. Este
        checklist fica somente nesta tela; não envia suas respostas.
      </GentleNote>
      <Card>
        {tasks.map((task, i) => (
          <Pressable
            key={task}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done.includes(i) }}
            aria-checked={done.includes(i)}
            onPress={() =>
              setDone((current) =>
                current.includes(i)
                  ? current.filter((v) => v !== i)
                  : [...current, i],
              )
            }
            style={{
              flexDirection: "row",
              gap: 12,
              paddingVertical: 14,
              minHeight: 48,
              alignItems: "center",
            }}
          >
            <Ionicons
              name={done.includes(i) ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={colors.primary}
            />
            <Text style={[m.body, { flex: 1 }]}>{task}</Text>
          </Pressable>
        ))}
      </Card>
      <View style={{ gap: 10 }}>
        <Text style={m.section}>Algo não saiu como esperado?</Text>
        <Text style={m.body}>
          Anote o modelo do celular, em qual tela aconteceu, o que você tentou
          fazer e o resultado. Compartilhe isso com quem convidou você para
          testar.
        </Text>
        <Text style={m.small}>
          Evite incluir senhas ou dados pessoais em capturas. Testes de câmera,
          localização e e-mail precisam acontecer no aparelho.
        </Text>
      </View>
      <QuietButton
        title="Enviar feedback"
        onPress={() => router.push("/feedback")}
      />
    </Screen>
  );
}
