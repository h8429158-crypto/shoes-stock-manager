import React, { useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, IconButton, List, Menu, Snackbar, Text, useTheme } from 'react-native-paper';

import { changeMemberRole, regenerateInviteCode, removeMember } from '@/db/mutations';
import { can, type OrgMember, type Role } from '@/lib/types';
import { useActiveOrg, useActiveRole, useAuthStore } from '@/store/auth';
import { useDataStore, userName } from '@/store/data';

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'Everything, incl. team & settings',
  manager: 'Products, stock, purchase orders',
  staff: 'Stock in/out and scanning',
};

export default function TeamScreen() {
  const theme = useTheme();
  const org = useActiveOrg();
  const myRole = useActiveRole();
  const myUserId = useAuthStore((s) => s.session?.user.id);
  const { members, profiles } = useDataStore();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [snack, setSnack] = useState('');
  const [busy, setBusy] = useState(false);

  const isOwner = can.manageTeam(myRole);
  const sorted = [...members].sort((a, b) => a.role.localeCompare(b.role));

  const shareInvite = async () => {
    if (!org) return;
    await Share.share({
      message: `Join "${org.name}" on StockRoom! Open the app, choose "Join with code" and enter: ${org.invite_code}`,
    });
  };

  const rotateCode = () => {
    if (!org) return;
    Alert.alert('Regenerate invite code', 'The current code will stop working. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Regenerate',
        onPress: async () => {
          try {
            setBusy(true);
            await regenerateInviteCode(org.id);
            setSnack('New invite code generated.');
          } catch (err) {
            setSnack(err instanceof Error ? err.message : 'Failed to regenerate code');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const setRole = async (member: OrgMember, role: Role) => {
    setMenuFor(null);
    if (member.role === role || !org) return;
    try {
      await changeMemberRole(org.id, member.user_id, role);
      setSnack(`${userName(profiles, member.user_id)} is now ${role}.`);
    } catch (err) {
      setSnack(err instanceof Error ? err.message : 'Failed to change role');
    }
  };

  const confirmRemove = (member: OrgMember) => {
    if (!org) return;
    Alert.alert('Remove member', `Remove ${userName(profiles, member.user_id)} from ${org.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeMember(org.id, member.user_id);
            setSnack('Member removed.');
          } catch (err) {
            setSnack(err instanceof Error ? err.message : 'Failed to remove member');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card mode="contained">
        <Card.Title title="Invite teammates" titleVariant="titleMedium" />
        <Card.Content style={{ gap: 8 }}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Share this code — teammates sign up, choose “Join with code”, and enter it. New members
            join as Staff; owners can promote them below.
          </Text>
          <View style={styles.codeRow}>
            <Text variant="headlineMedium" style={styles.code}>
              {org?.invite_code ?? '········'}
            </Text>
            {isOwner ? <IconButton icon="refresh" onPress={rotateCode} disabled={busy} /> : null}
          </View>
        </Card.Content>
        <Card.Actions>
          <Button icon="share-variant" mode="contained-tonal" onPress={shareInvite}>
            Share invite
          </Button>
        </Card.Actions>
      </Card>

      <Text variant="titleMedium" style={{ fontWeight: '700', marginTop: 4 }}>
        Members ({members.length})
      </Text>

      {sorted.map((member) => {
        const name = userName(profiles, member.user_id);
        const isMe = member.user_id === myUserId;
        return (
          <List.Item
            key={member.user_id}
            title={`${name}${isMe ? ' (you)' : ''}`}
            description={ROLE_DESCRIPTIONS[member.role]}
            left={(p) => <List.Icon {...p} icon={member.role === 'owner' ? 'crown-outline' : member.role === 'manager' ? 'account-tie' : 'account-outline'} />}
            right={() => (
              <View style={styles.memberRight}>
                {isOwner && !isMe ? (
                  <Menu
                    visible={menuFor === member.user_id}
                    onDismiss={() => setMenuFor(null)}
                    anchor={
                      <Chip compact onPress={() => setMenuFor(member.user_id)} icon="chevron-down">
                        {member.role}
                      </Chip>
                    }
                  >
                    {(['owner', 'manager', 'staff'] as Role[]).map((r) => (
                      <Menu.Item key={r} title={r} trailingIcon={member.role === r ? 'check' : undefined} onPress={() => void setRole(member, r)} />
                    ))}
                  </Menu>
                ) : (
                  <Chip compact>{member.role}</Chip>
                )}
                {isOwner && !isMe ? (
                  <IconButton icon="account-remove-outline" size={18} iconColor={theme.colors.error} onPress={() => confirmRemove(member)} />
                ) : null}
              </View>
            )}
          />
        );
      })}

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')}>
        {snack}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, paddingBottom: 48 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  code: { fontWeight: '700', letterSpacing: 4 },
  memberRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
