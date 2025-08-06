import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    borderRadius: 6,
    marginVertical: 6,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: { color: 'white', fontWeight: 'bold' },
  cancelButton: {
    backgroundColor: '#6b7280',
    padding: 10,
    marginTop: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: { color: 'white', fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 6,
    flexDirection: 'row',
    elevation: 2,
  },
  cardButtons: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardText: { fontSize: 12, color: '#555' },
  editButton: {
    backgroundColor: '#facc15',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 6,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  sidebar: {
    width: 180,
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  sidebarText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 20,
  },
  sidebarItem: {
    fontSize: 16,
    paddingVertical: 10,
    color: '#1f2937',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
});