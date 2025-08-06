import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Pagination = ({ currentPage, totalPages, totalItems, onPageChange }) => (
  <View style={styles.paginationContainer}>
    <TouchableOpacity
      style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
      onPress={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
    >
      <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#6b7280' : '#ffffff'} />
    </TouchableOpacity>
    
    <View style={styles.paginationInfo}>
      <Text style={styles.paginationText}>
        Página {currentPage} de {totalPages}
      </Text>
      <Text style={styles.paginationSubtext}>
        {totalItems} registros
      </Text>
    </View>
    
    <TouchableOpacity
      style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
      onPress={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
    >
      <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#6b7280' : '#ffffff'} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginTop: 8,
  },
  paginationButton: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  paginationButtonDisabled: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationSubtext: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
});

export default Pagination;