import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import typography from '../../theme/typography';
import spacing from '../../theme/spacing';

export default function InviteContactsModal({ visible, team, onClose }) {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissionError, setPermissionError] = useState('');

  useEffect(() => {
    if (visible) {
      loadContacts();
    } else {
      setSearchQuery('');
      setPermissionError('');
    }
  }, [visible]);

  const loadContacts = async () => {
    setLoading(true);
    setPermissionError('');
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermissionError('Contacts permission is required to invite friends directly.');
        setLoading(false);
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        sort: Contacts.SortTypes.FirstName,
      });

      if (data && data.length > 0) {
        // Filter contacts that have a name
        const validContacts = data.filter((c) => c.name && c.name.trim().length > 0);
        setContacts(validContacts);
      } else {
        setContacts([]);
      }
    } catch (err) {
      setPermissionError('Unable to load phone contacts.');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteContact = async (contact) => {
    if (!team?.code) return;
    try {
      const phone = contact.phoneNumbers?.[0]?.number || '';
      await Share.share({
        message: `⚔️ Hey ${contact.name}! Join my Quest Overworld adventuring party "${team.name}" using invite code: ${team.code} 🏆`,
      });
    } catch (err) {
      // Ignored
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>RECRUIT FRIENDS</Text>
              <Text style={styles.subtitle}>Invite phone contacts to {team?.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="close" size={20} color={colors.text.onDark.secondary} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          {!permissionError ? (
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={18}
                color={colors.text.onDark.secondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search phone contacts..."
                placeholderTextColor={colors.text.onDark.secondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={16}
                    color={colors.text.onDark.secondary}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Content */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.accent.gold} />
              <Text style={styles.loadingText}>Reading phone contacts...</Text>
            </View>
          ) : permissionError ? (
            <View style={styles.centerBox}>
              <MaterialCommunityIcons name="account-off" size={40} color={colors.accent.coral} />
              <Text style={styles.errorText}>{permissionError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadContacts} activeOpacity={0.8}>
                <Text style={styles.retryBtnText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No matching contacts found.' : 'No contacts found on device.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id || item.name}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const initial = (item.name || 'A').charAt(0).toUpperCase();
                const phone =
                  item.phoneNumbers?.[0]?.number || item.emails?.[0]?.email || 'Contact';

                return (
                  <View style={styles.contactRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.contactPhone} numberOfLines={1}>
                        {phone}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.inviteBtn}
                      onPress={() => handleInviteContact(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.inviteBtnText}>INVITE</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}

          {/* Footer note */}
          <View style={styles.footer}>
            <Text style={styles.footerCode}>
              PARTY CODE: <Text style={styles.footerCodeVal}>{team?.code}</Text>
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 8, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  modalCard: {
    backgroundColor: colors.bg.duskRaised,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.accent.gold,
    width: '100%',
    maxHeight: '80%',
    padding: spacing.cardPadding,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.headingLg,
    color: colors.accent.gold,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1A33',
    borderWidth: 1,
    borderColor: '#3D3560',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    height: 40,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    ...typography.bodyMd,
  },
  centerBox: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  errorText: {
    ...typography.bodyMd,
    color: colors.accent.coral,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  retryBtnText: {
    ...typography.caption,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.text.onDark.secondary,
  },
  listContent: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1A33',
    padding: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#362E52',
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#322A54',
    borderWidth: 1,
    borderColor: colors.accent.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.bodyLg,
    fontWeight: '900',
    color: colors.accent.gold,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...typography.bodyMd,
    fontWeight: '800',
    color: colors.text.onDark.primary,
  },
  contactPhone: {
    ...typography.caption,
    color: colors.text.onDark.secondary,
  },
  inviteBtn: {
    backgroundColor: colors.accent.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 4,
  },
  inviteBtnText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '900',
    color: colors.bg.dusk,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#362E52',
    paddingTop: spacing.xs,
    alignItems: 'center',
  },
  footerCode: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.onDark.secondary,
    letterSpacing: 1,
  },
  footerCodeVal: {
    color: colors.accent.gold,
    fontWeight: '900',
  },
});
