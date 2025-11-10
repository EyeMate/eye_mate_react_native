//home.tsx
import { useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import ttsService from "../services/ttsService";

export default function Home() {
  const { voice, lang } = useLocalSearchParams<{ voice: string; lang: string }>();

  useEffect(() => {
    const speakGreeting = async () => {
      try {
        const selectedLanguage = lang === "fr" ? "fr" : "en";
        const selectedVoice = voice === "female" ? "female" : "male";

        ttsService.setLanguage(selectedLanguage);
        ttsService.setVoiceGender(selectedVoice);

        const text =
          selectedLanguage === "fr"
            ? "Comment puis-je vous aider aujourd'hui ?"
            : "How can I help you today?";

        await ttsService.speak(text);
      } catch (error) {
        console.error("Erreur TTS:", error);
      }
    };

    speakGreeting();
  }, [lang, voice]);

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