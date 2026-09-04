import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { subscribeQueue, processQueue } from '../lib/offlineQueue';
import colors from '../theme/colors';
import typography from '../theme/typography';
import spacing from '../theme/spacing';

export default function OfflineSyncBanner() {
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeQueue((queue, isProcessing) => {
      setQueueCount(queue.length);
      setSyncing(isProcessing);
      setHasFailed(queue.some((item) => item.failed));
    });
    return unsubscribe;
  }, []);

  if (queueCount === 0) return null;

  return (
    <TouchableOpacity
      style={[styles.banner, hasFailed ? styles.bannerFailed : null]}
      onPress={() => {
        if (!syncing) {
          processQueue();
        }
      }}
      activeOpacity={0.8}
      disabled={syncing}
    >
      <View style={styles.left}>
        {syncing ? (
          <ActivityIndicator size="small" color={colors.accent.gold} />
        ) : (
          <MaterialCommunityIcons
            name={hasFailed ? 'alert-circle-outline' : 'cloud-sync-outline'}
            size={20}
            color={hasFailed ? colors.accent.coral : colors.accent.gold}
          />
        )}
        <Text style={[styles.text, hasFailed ? styles.textFailed : null]}>
          {syncing
            ? `Syncing ${queueCount} scan${queueCount > 1 ? 's' : ''}...`
            : hasFailed
              ? `${queueCount} scan${queueCount > 1 ? 's' : ''} queued (sync paused) — tap to view`
              : `${queueCount} scan${queueCount > 1 ? 's' : ''} queued offline — tap to sync`}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2242',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.accent.gold,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    zIndex: 999,
  },
  bannerFailed: {
    backgroundColor: 'rgba(232, 102, 75, 0.2)',
    borderBottomColor: colors.accent.coral,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  text: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent.gold,
  },
  textFailed: {
    color: colors.accent.coral,
  },
  arrow: {
    ...typography.headingSm,
    color: colors.accent.gold,
    fontWeight: '900',
    marginLeft: spacing.xs,
  },
});
