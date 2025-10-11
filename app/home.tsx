import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import SherpaOnnx from "react-native-sherpa-onnx-offline-tts";

export default function Home() {
  const { voice, lang } = useLocalSearchParams<{ voice: string; lang: string }>();

  useEffect(() => {
    const initAndSpeak = async () => {
      try {
        // Initialisation avec un identifiant de modèle (string)
        await SherpaOnnx.initialize("default-model");

        const text =
          lang === "fr"
            ? "Comment puis-je vous aider aujourd'hui ?"
            : "How can I help you today?";

        // Utilisation de generateAndPlay au lieu de speak
        // sid = speaker ID, speed = vitesse de lecture
        await SherpaOnnx.generateAndPlay(text, 0, 1.0);
      } catch (e) {
        console.error("Erreur TTS:", e);
      }
    };

    initAndSpeak();
  }, [lang]); // Ajout de lang comme dépendance

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {lang === "fr"
          ? "Comment puis-je vous aider aujourd'hui ?"
          : "How can I help you today?"}
      </Text>
      <Text style={styles.subtitle}>
        ({voice === "male" ? "Voix masculine" : "Voix féminine"})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", margin: 10, textAlign: "center" },
  subtitle: { color: "gray" },
});