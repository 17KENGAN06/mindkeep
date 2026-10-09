import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { contactApi } from '../../api/contact';
import { AppButton, ChoiceChip } from '../../components/ui';
import { CONTACT_INBOX, CONTACT_TOPICS, inboxForTopic, type ContactTopic } from '../../config/contact';
import { issueBotToken } from '../../features/auth/botChallenge';
import { mapContactError } from '../../features/contact/mapContactError';
import { useAuth } from '../../features/auth/useAuth';
import { useTheme } from '../../features/theme/useTheme';
import { fonts } from '../../config/fonts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [topic, setTopic] = useState<ContactTopic | ''>('');
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const destination = useMemo(() => (topic ? inboxForTopic(topic) : null), [topic]);

  const onSubmit = async () => {
    setError(null);
    if (!topic) {
      setError(t('contact.errors.topicRequired'));
      return;
    }
    if (!name.trim()) {
      setError(t('contact.errors.nameRequired'));
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(t('contact.errors.email'));
      return;
    }
    if (message.trim().length < 10) {
      setError(t('contact.errors.messageMin'));
      return;
    }
    if (message.length > 5000) {
      setError(t('contact.errors.messageMax'));
      return;
    }

    setBusy(true);
    try {
      const botToken = await issueBotToken();
      await contactApi.send({
        topic,
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        botToken,
        website: '',
      });
      setSent(true);
    } catch (caught) {
      setError(mapContactError(caught, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.intro, { color: colors.muted }]}>{t('contact.intro')}</Text>

        <Pressable
          onPress={() => void Linking.openURL(`mailto:${CONTACT_INBOX.partnership}`)}
          style={[styles.mailCard, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <Text style={[styles.mailTitle, { color: colors.ink }]}>{t('contact.partnershipTitle')}</Text>
          <Text style={[styles.mailBody, { color: colors.muted }]}>{t('contact.partnershipBody')}</Text>
          <Text style={[styles.link, { color: colors.brand }]}>{CONTACT_INBOX.partnership}</Text>
        </Pressable>
        <Pressable
          onPress={() => void Linking.openURL(`mailto:${CONTACT_INBOX.support}`)}
          style={[styles.mailCard, { backgroundColor: colors.panel, borderColor: colors.line }]}
        >
          <Text style={[styles.mailTitle, { color: colors.ink }]}>{t('contact.supportTitle')}</Text>
          <Text style={[styles.mailBody, { color: colors.muted }]}>{t('contact.supportBody')}</Text>
          <Text style={[styles.link, { color: colors.brand }]}>{CONTACT_INBOX.support}</Text>
        </Pressable>

        {sent ? (
          <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>{t('contact.successTitle')}</Text>
            <Text style={[styles.intro, { color: colors.muted }]}>{t('contact.successBody')}</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.panel, borderColor: colors.line }]}>
            <Text style={[styles.label, { color: colors.muted }]}>{t('contact.fields.topic')}</Text>
            <View style={styles.row}>
              {CONTACT_TOPICS.map((item) => (
                <ChoiceChip
                  key={item}
                  label={t(`contact.topics.${item}`)}
                  selected={topic === item}
                  onPress={() => setTopic(item)}
                />
              ))}
            </View>
            {destination ? (
              <Text style={[styles.meta, { color: colors.muted }]}>
                {t('contact.destination', { email: destination })}
              </Text>
            ) : null}

            <Text style={[styles.label, { color: colors.muted }]}>{t('contact.fields.name')}</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
              ]}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: colors.muted }]}>{t('contact.fields.email')}</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.input,
                { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
              ]}
              value={email}
              onChangeText={setEmail}
            />

            <Text style={[styles.label, { color: colors.muted }]}>{t('contact.fields.message')}</Text>
            <TextInput
              multiline
              style={[
                styles.input,
                styles.area,
                { backgroundColor: colors.bg, borderColor: colors.line, color: colors.ink },
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder={t('contact.placeholders.message')}
              placeholderTextColor={colors.muted}
            />

            {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
            <AppButton label={t('contact.send')} loading={busy} onPress={() => void onSubmit()} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 12, padding: 20, paddingBottom: 40 },
  intro: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  mailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  mailTitle: { fontSize: 16, fontFamily: fonts.bold },
  mailBody: { fontFamily: fonts.regular, fontSize: 13, marginTop: 6 },
  link: { fontFamily: fonts.regular, fontSize: 13, marginTop: 8 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  cardTitle: { fontSize: 18, fontFamily: fonts.bold },
  label: { fontSize: 13, fontFamily: fonts.semibold, marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  meta: { fontFamily: fonts.regular, fontSize: 12 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  area: { minHeight: 120, textAlignVertical: 'top' },
  error: { fontFamily: fonts.regular, fontSize: 14 },
});
