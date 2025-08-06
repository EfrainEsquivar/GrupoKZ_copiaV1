import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const TypingIndicator = ({ styles }) => {
  const [dotOpacity, setDotOpacity] = useState([1, 0.5, 0.3]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotOpacity(prev => [
        prev[2],
        prev[0], 
        prev[1]
      ]);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.typingIndicator}>
      <Text style={styles.mensajeTexto}>IA está escribiendo</Text>
      <View style={styles.typingDots}>
        {dotOpacity.map((opacity, index) => (
          <View 
            key={index} 
            style={[
              styles.typingDot, 
              { opacity }
            ]} 
          />
        ))}
      </View>
    </View>
  );
};

export const ChatPanel = ({ styles, chatVisible, setChatVisible, isPhone, mensajes, iaEscribiendo, mensaje, setMensaje, handleEnviarMensaje, scrollViewRef }) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={styles.chatPanel}
  >
    <TouchableOpacity 
      style={styles.botonCerrarChat} 
      onPress={() => setChatVisible(false)}
    >
      <FontAwesome5 name={isPhone ? 'times' : 'chevron-right'} size={12} color="#fff" />
    </TouchableOpacity>

    <Text style={styles.chatTitle}>🤖 Asistente IA</Text>

    <ScrollView 
      style={styles.chatMensajes} 
      showsVerticalScrollIndicator={false}
      ref={scrollViewRef}
      onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
    >
      {mensajes.map((msg, index) => (
        <View key={index} style={[styles.mensaje, msg.propio ? styles.mensajePropio : styles.mensajeOtro]}>
          <Text style={styles.mensajeTexto}>{msg.texto}</Text>
        </View>
      ))}
      {iaEscribiendo && <TypingIndicator styles={styles} />}
    </ScrollView>
    <View style={styles.chatInputContainer}>
      <TextInput
        placeholder="Escribe un mensaje..."
        placeholderTextColor="#94a3b8"
        value={mensaje}
        onChangeText={setMensaje}
        style={styles.chatInput}
        multiline
        numberOfLines={1}
        maxLength={500}
        returnKeyType="send"
        onSubmitEditing={handleEnviarMensaje}
        blurOnSubmit={false}
      />
      <TouchableOpacity 
        onPress={handleEnviarMensaje}
        style={{ minWidth: 36, minHeight: 36, justifyContent: 'center', alignItems: 'center' }}
      >
        <FontAwesome5 name="paper-plane" size={14} color="#3b82f6" />
      </TouchableOpacity>
    </View>
  </KeyboardAvoidingView>
);