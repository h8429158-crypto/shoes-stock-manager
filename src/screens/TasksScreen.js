import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';

import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { colors, spacing, font, radius, categoryColors } from '../theme/theme';
import { useApp } from '../state/AppContext';
import { taskPoints } from '../logic/points';

export default function TasksScreen({ navigation }) {
  const { tasks, priorityCategory, removeTask } = useApp();
  const activeTasks = tasks.filter((t) => !t.archived);

  const confirmDelete = (task) => {
    Alert.alert('Delete task', `Remove "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTask(task.id) },
    ]);
  };

  return (
    <Screen
      title="My tasks"
      subtitle={`${activeTasks.length} daily habit${activeTasks.length === 1 ? '' : 's'}`}
      right={
        <Button
          title="Add"
          icon="＋"
          onPress={() => navigation.navigate('TaskEdit', {})}
          style={styles.addBtn}
        />
      }
    >
      {activeTasks.length === 0 ? (
        <Card>
          <Text style={styles.empty}>
            No tasks yet. Tap “Add” to create your first daily habit.
          </Text>
        </Card>
      ) : (
        activeTasks.map((task) => {
          const pts = taskPoints(task, priorityCategory);
          const isPriority = priorityCategory && task.category === priorityCategory;
          return (
            <Pressable
              key={task.id}
              onPress={() => navigation.navigate('TaskEdit', { taskId: task.id })}
              style={styles.row}
            >
              <View style={[styles.bar, { backgroundColor: categoryColors[task.category] }]} />
              <View style={styles.middle}>
                <Text style={styles.title}>{task.title}</Text>
                <Text style={styles.meta}>
                  {task.category} · {task.importance}
                  {isPriority ? '  ⭐ 2×' : ''}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.points}>+{pts}</Text>
                <Pressable
                  hitSlop={10}
                  onPress={() => confirmDelete(task)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: { minHeight: 44, paddingHorizontal: spacing.lg },
  empty: { color: colors.textDim, fontSize: font.md, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  bar: { width: 5, alignSelf: 'stretch' },
  middle: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  title: { color: colors.text, fontSize: font.md, fontWeight: '700' },
  meta: { color: colors.textDim, fontSize: font.xs, marginTop: 3 },
  right: { alignItems: 'flex-end', paddingRight: spacing.md },
  points: { color: colors.accent, fontSize: font.md, fontWeight: '800' },
  deleteBtn: { marginTop: 4 },
  deleteText: { color: colors.danger, fontSize: font.xs, fontWeight: '700' },
});
