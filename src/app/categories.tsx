import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet } from 'react-native';
import { Button, Dialog, Divider, FAB, HelperText, IconButton, List, Portal, Text, TextInput } from 'react-native-paper';

import { EmptyState } from '@/components/empty-state';
import { deleteCategory, saveCategory } from '@/db/mutations';
import { can, type Category } from '@/lib/types';
import { categorySchema, zodErrors } from '@/lib/validation';
import { useActiveRole, useAuthStore } from '@/store/auth';
import { useDataStore } from '@/store/data';

export default function CategoriesScreen() {
  const role = useActiveRole();
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const { categories, products } = useDataStore();

  const [editing, setEditing] = useState<Category | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const manage = can.manageCatalog(role);
  const productCount = (id: string) => products.filter((p) => p.category_id === id).length;

  const openDialog = (category?: Category) => {
    setEditing(category ?? null);
    setName(category?.name ?? '');
    setError('');
    setDialogOpen(true);
  };

  const save = () => {
    if (!activeOrgId) return;
    const parsed = categorySchema.safeParse({ name });
    const errs = zodErrors(parsed);
    if (!parsed.success) {
      setError(errs.name ?? 'Invalid name');
      return;
    }
    const duplicate = categories.some(
      (c) => c.name.trim().toLowerCase() === parsed.data.name.toLowerCase() && c.id !== editing?.id
    );
    if (duplicate) {
      setError('A category with this name already exists');
      return;
    }
    saveCategory(activeOrgId, parsed.data.name, editing ?? undefined);
    setDialogOpen(false);
  };

  const confirmDelete = (category: Category) => {
    const count = productCount(category.id);
    Alert.alert(
      'Delete category',
      count > 0
        ? `"${category.name}" is used by ${count} product${count === 1 ? '' : 's'}. They will become uncategorized.`
        : `Delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(category.id) },
      ]
    );
  };

  return (
    <>
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        ItemSeparatorComponent={Divider}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={`${productCount(item.id)} product${productCount(item.id) === 1 ? '' : 's'}`}
            onPress={manage ? () => openDialog(item) : undefined}
            right={() =>
              manage ? (
                <IconButton icon="trash-can-outline" size={18} onPress={() => confirmDelete(item)} />
              ) : null
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="tag-multiple-outline"
            title="No categories yet"
            message={manage ? 'Categories help you filter and report on products.' : undefined}
            actionLabel={manage ? 'Add category' : undefined}
            onAction={() => openDialog()}
          />
        }
        contentContainerStyle={categories.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : { paddingBottom: 96 }}
      />
      {manage ? <FAB icon="plus" style={styles.fab} onPress={() => openDialog()} /> : null}

      <Portal>
        <Dialog visible={dialogOpen} onDismiss={() => setDialogOpen(false)}>
          <Dialog.Title>{editing ? 'Edit category' : 'New category'}</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" value={name} onChangeText={setName} autoFocus error={!!error} />
            {error ? <HelperText type="error">{error}</HelperText> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogOpen(false)}>Cancel</Button>
            <Button mode="contained" onPress={save}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
