import React, { useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet } from 'react-native';
import { Button, Dialog, Divider, FAB, HelperText, IconButton, List, Portal, TextInput } from 'react-native-paper';

import { EmptyState } from '@/components/empty-state';
import { deleteSupplier, saveSupplier } from '@/db/mutations';
import { can, type Supplier } from '@/lib/types';
import { supplierSchema, zodErrors } from '@/lib/validation';
import { useActiveRole, useAuthStore } from '@/store/auth';
import { useDataStore } from '@/store/data';

export default function SuppliersScreen() {
  const role = useActiveRole();
  const activeOrgId = useAuthStore((s) => s.activeOrgId);
  const { suppliers, products } = useDataStore();

  const [editing, setEditing] = useState<Supplier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', contactName: '', email: '', phone: '', leadTimeDays: '7', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const manage = can.manageCatalog(role);
  const productCount = (id: string) => products.filter((p) => p.supplier_id === id).length;

  const openDialog = (supplier?: Supplier) => {
    setEditing(supplier ?? null);
    setForm({
      name: supplier?.name ?? '',
      contactName: supplier?.contact_name ?? '',
      email: supplier?.email ?? '',
      phone: supplier?.phone ?? '',
      leadTimeDays: String(supplier?.lead_time_days ?? 7),
      notes: supplier?.notes ?? '',
    });
    setErrors({});
    setDialogOpen(true);
  };

  const save = () => {
    if (!activeOrgId) return;
    const parsed = supplierSchema.safeParse(form);
    const errs = zodErrors(parsed);
    setErrors(errs);
    if (!parsed.success) return;

    saveSupplier(
      activeOrgId,
      {
        name: parsed.data.name,
        contact_name: parsed.data.contactName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        lead_time_days: parsed.data.leadTimeDays ? Number(parsed.data.leadTimeDays) : 0,
        notes: parsed.data.notes,
      },
      editing ?? undefined
    );
    setDialogOpen(false);
  };

  const confirmDelete = (supplier: Supplier) => {
    const count = productCount(supplier.id);
    Alert.alert(
      'Delete supplier',
      count > 0
        ? `"${supplier.name}" supplies ${count} product${count === 1 ? '' : 's'}. They will lose their supplier.`
        : `Delete "${supplier.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSupplier(supplier.id) },
      ]
    );
  };

  return (
    <>
      <FlatList
        data={suppliers}
        keyExtractor={(s) => s.id}
        ItemSeparatorComponent={Divider}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={[
              item.contact_name,
              item.email,
              item.phone,
              `Lead time ${item.lead_time_days}d`,
              `${productCount(item.id)} products`,
            ]
              .filter(Boolean)
              .join(' · ')}
            descriptionNumberOfLines={2}
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
            icon="truck-outline"
            title="No suppliers yet"
            message={manage ? 'Add suppliers to create purchase orders and get reorder suggestions.' : undefined}
            actionLabel={manage ? 'Add supplier' : undefined}
            onAction={() => openDialog()}
          />
        }
        contentContainerStyle={suppliers.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : { paddingBottom: 96 }}
      />
      {manage ? <FAB icon="plus" style={styles.fab} onPress={() => openDialog()} /> : null}

      <Portal>
        <Dialog visible={dialogOpen} onDismiss={() => setDialogOpen(false)} style={{ maxHeight: '85%' }}>
          <Dialog.Title>{editing ? 'Edit supplier' : 'New supplier'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput label="Name *" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} error={!!errors.name} style={styles.field} />
              {errors.name ? <HelperText type="error">{errors.name}</HelperText> : null}
              <TextInput label="Contact person" value={form.contactName} onChangeText={(t) => setForm({ ...form, contactName: t })} style={styles.field} />
              <TextInput label="Email" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} autoCapitalize="none" keyboardType="email-address" error={!!errors.email} style={styles.field} />
              {errors.email ? <HelperText type="error">{errors.email}</HelperText> : null}
              <TextInput label="Phone" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} keyboardType="phone-pad" style={styles.field} />
              <TextInput label="Lead time (days)" value={form.leadTimeDays} onChangeText={(t) => setForm({ ...form, leadTimeDays: t.replace(/[^0-9]/g, '') })} keyboardType="number-pad" error={!!errors.leadTimeDays} style={styles.field} />
              {errors.leadTimeDays ? <HelperText type="error">{errors.leadTimeDays}</HelperText> : null}
              <TextInput label="Notes" value={form.notes} onChangeText={(t) => setForm({ ...form, notes: t })} multiline style={styles.field} />
            </ScrollView>
          </Dialog.ScrollArea>
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
  field: { marginVertical: 4 },
});
