import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Componente de Loading
const LoadingComponent = ({ text = "Cargando..." }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={styles.loadingText}>{text}</Text>
  </View>
);

// Componente de Estado vacío
const EmptyState = ({ message, hasSearch = false }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="document-text-outline" size={64} color="#6b7280" />
    <Text style={styles.emptyText}>
      {hasSearch ? 'No se encontraron pedidos con esa búsqueda' : message}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export { LoadingComponent, EmptyState };