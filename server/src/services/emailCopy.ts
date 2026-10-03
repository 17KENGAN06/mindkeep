export const APP_LOCALES = ['uk', 'ru', 'en', 'pl', 'de', 'fr', 'it', 'es', 'fi'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export function resolveAppLocale(value?: string | null): AppLocale {
  const code = (value ?? '').trim().toLowerCase().split(/[-_]/)[0] ?? '';
  return (APP_LOCALES as readonly string[]).includes(code) ? (code as AppLocale) : 'en';
}

type MailCopy = { subject: string; text: string };

const verifyCopy: Record<AppLocale, (name: string, link: string) => MailCopy> = {
  en: (name, link) => ({
    subject: 'Confirm your MindKeep account',
    text: [
      `Hi ${name},`,
      '',
      'Confirm this email to finish creating your MindKeep account:',
      link,
      '',
      'This link expires in 24 hours. If you did not sign up, you can ignore this message.',
    ].join('\n'),
  }),
  ru: (name, link) => ({
    subject: 'Подтвердите аккаунт MindKeep',
    text: [
      `Здравствуйте, ${name}!`,
      '',
      'Подтвердите почту, чтобы закончить регистрацию в MindKeep:',
      link,
      '',
      'Ссылка действует 24 часа. Если вы не регистрировались, просто проигнорируйте это письмо.',
    ].join('\n'),
  }),
  uk: (name, link) => ({
    subject: 'Підтвердіть акаунт MindKeep',
    text: [
      `Вітаємо, ${name}!`,
      '',
      'Підтвердіть пошту, щоб завершити реєстрацію в MindKeep:',
      link,
      '',
      'Посилання діє 24 години. Якщо ви не реєструвалися, просто ігноруйте цей лист.',
    ].join('\n'),
  }),
  pl: (name, link) => ({
    subject: 'Potwierdź konto MindKeep',
    text: [
      `Cześć ${name},`,
      '',
      'Potwierdź ten adres e-mail, aby dokończyć tworzenie konta MindKeep:',
      link,
      '',
      'Link wygasa po 24 godzinach. Jeśli to nie Ty się rejestrowałeś, zignoruj tę wiadomość.',
    ].join('\n'),
  }),
  de: (name, link) => ({
    subject: 'Bestätige dein MindKeep-Konto',
    text: [
      `Hallo ${name},`,
      '',
      'Bestätige diese E-Mail, um dein MindKeep-Konto fertig anzulegen:',
      link,
      '',
      'Der Link ist 24 Stunden gültig. Wenn du dich nicht registriert hast, ignoriere diese Nachricht.',
    ].join('\n'),
  }),
  fr: (name, link) => ({
    subject: 'Confirme ton compte MindKeep',
    text: [
      `Bonjour ${name},`,
      '',
      'Confirme cet e-mail pour terminer la création de ton compte MindKeep :',
      link,
      '',
      'Le lien expire dans 24 heures. Si tu ne t’es pas inscrit, ignore ce message.',
    ].join('\n'),
  }),
  it: (name, link) => ({
    subject: 'Conferma il tuo account MindKeep',
    text: [
      `Ciao ${name},`,
      '',
      'Conferma questa e-mail per completare la creazione del tuo account MindKeep:',
      link,
      '',
      'Il link scade tra 24 ore. Se non ti sei registrato tu, ignora questo messaggio.',
    ].join('\n'),
  }),
  es: (name, link) => ({
    subject: 'Confirma tu cuenta de MindKeep',
    text: [
      `Hola ${name},`,
      '',
      'Confirma este correo para terminar de crear tu cuenta de MindKeep:',
      link,
      '',
      'El enlace caduca en 24 horas. Si no te registraste, ignora este mensaje.',
    ].join('\n'),
  }),
  fi: (name, link) => ({
    subject: 'Vahvista MindKeep-tilisi',
    text: [
      `Hei ${name},`,
      '',
      'Vahvista tämä sähköposti viimeistelläksesi MindKeep-tilin luonnin:',
      link,
      '',
      'Linkki vanhenee 24 tunnissa. Jos et rekisteröitynyt, voit jättää viestin huomiotta.',
    ].join('\n'),
  }),
};

const resetCopy: Record<AppLocale, (name: string, link: string) => MailCopy> = {
  en: (name, link) => ({
    subject: 'Reset your MindKeep password',
    text: [
      `Hi ${name},`,
      '',
      'Use this link to choose a new password:',
      link,
      '',
      'This link expires in 1 hour. If you did not ask for a reset, you can ignore this message.',
    ].join('\n'),
  }),
  ru: (name, link) => ({
    subject: 'Сброс пароля MindKeep',
    text: [
      `Здравствуйте, ${name}!`,
      '',
      'Перейдите по ссылке, чтобы задать новый пароль:',
      link,
      '',
      'Ссылка действует 1 час. Если вы не запрашивали сброс, просто проигнорируйте это письмо.',
    ].join('\n'),
  }),
  uk: (name, link) => ({
    subject: 'Скидання пароля MindKeep',
    text: [
      `Вітаємо, ${name}!`,
      '',
      'Перейдіть за посиланням, щоб задати новий пароль:',
      link,
      '',
      'Посилання діє 1 годину. Якщо ви не просили скидання, просто ігноруйте цей лист.',
    ].join('\n'),
  }),
  pl: (name, link) => ({
    subject: 'Reset hasła MindKeep',
    text: [
      `Cześć ${name},`,
      '',
      'Użyj tego linku, aby ustawić nowe hasło:',
      link,
      '',
      'Link wygasa po godzinie. Jeśli nie prosiłeś o reset, zignoruj tę wiadomość.',
    ].join('\n'),
  }),
  de: (name, link) => ({
    subject: 'MindKeep-Passwort zurücksetzen',
    text: [
      `Hallo ${name},`,
      '',
      'Nutze diesen Link, um ein neues Passwort zu wählen:',
      link,
      '',
      'Der Link ist 1 Stunde gültig. Wenn du keinen Reset angefordert hast, ignoriere diese Nachricht.',
    ].join('\n'),
  }),
  fr: (name, link) => ({
    subject: 'Réinitialise ton mot de passe MindKeep',
    text: [
      `Bonjour ${name},`,
      '',
      'Utilise ce lien pour choisir un nouveau mot de passe :',
      link,
      '',
      'Le lien expire dans 1 heure. Si tu n’as pas demandé de réinitialisation, ignore ce message.',
    ].join('\n'),
  }),
  it: (name, link) => ({
    subject: 'Reimposta la password di MindKeep',
    text: [
      `Ciao ${name},`,
      '',
      'Usa questo link per scegliere una nuova password:',
      link,
      '',
      'Il link scade tra 1 ora. Se non hai chiesto tu il reset, ignora questo messaggio.',
    ].join('\n'),
  }),
  es: (name, link) => ({
    subject: 'Restablece tu contraseña de MindKeep',
    text: [
      `Hola ${name},`,
      '',
      'Usa este enlace para elegir una contraseña nueva:',
      link,
      '',
      'El enlace caduca en 1 hora. Si no pediste el restablecimiento, ignora este mensaje.',
    ].join('\n'),
  }),
  fi: (name, link) => ({
    subject: 'Nollaa MindKeep-salasanasi',
    text: [
      `Hei ${name},`,
      '',
      'Valitse uusi salasana tämän linkin kautta:',
      link,
      '',
      'Linkki vanhenee tunnissa. Jos et pyytänyt nollausta, voit jättää viestin huomiotta.',
    ].join('\n'),
  }),
};

const loginCodeCopy: Record<AppLocale, (name: string, code: string) => MailCopy> = {
  en: (name, code) => ({
    subject: 'Your MindKeep sign-in code',
    text: [
      `Hi ${name},`,
      '',
      `Your sign-in code is ${code}.`,
      'It expires in 10 minutes. If you did not try to sign in, you can ignore this message.',
    ].join('\n'),
  }),
  ru: (name, code) => ({
    subject: 'Код входа в MindKeep',
    text: [
      `Здравствуйте, ${name}!`,
      '',
      `Код для входа: ${code}.`,
      'Он действует 10 минут. Если вы не входили, просто проигнорируйте это письмо.',
    ].join('\n'),
  }),
  uk: (name, code) => ({
    subject: 'Код входу в MindKeep',
    text: [
      `Вітаємо, ${name}!`,
      '',
      `Код для входу: ${code}.`,
      'Він діє 10 хвилин. Якщо ви не входили, просто ігноруйте цей лист.',
    ].join('\n'),
  }),
  pl: (name, code) => ({
    subject: 'Kod logowania MindKeep',
    text: [
      `Cześć ${name},`,
      '',
      `Twój kod logowania: ${code}.`,
      'Wygasa po 10 minutach. Jeśli to nie Ty się logowałeś, zignoruj tę wiadomość.',
    ].join('\n'),
  }),
  de: (name, code) => ({
    subject: 'Dein MindKeep-Anmeldecode',
    text: [
      `Hallo ${name},`,
      '',
      `Dein Anmeldecode ist ${code}.`,
      'Er ist 10 Minuten gültig. Wenn du dich nicht angemeldet hast, ignoriere diese Nachricht.',
    ].join('\n'),
  }),
  fr: (name, code) => ({
    subject: 'Ton code de connexion MindKeep',
    text: [
      `Bonjour ${name},`,
      '',
      `Ton code de connexion est ${code}.`,
      'Il expire dans 10 minutes. Si tu n’as pas essayé de te connecter, ignore ce message.',
    ].join('\n'),
  }),
  it: (name, code) => ({
    subject: 'Il tuo codice di accesso MindKeep',
    text: [
      `Ciao ${name},`,
      '',
      `Il codice di accesso è ${code}.`,
      'Scade tra 10 minuti. Se non hai provato ad accedere, ignora questo messaggio.',
    ].join('\n'),
  }),
  es: (name, code) => ({
    subject: 'Tu código de acceso a MindKeep',
    text: [
      `Hola ${name},`,
      '',
      `Tu código de acceso es ${code}.`,
      'Caduca en 10 minutos. Si no intentaste entrar, ignora este mensaje.',
    ].join('\n'),
  }),
  fi: (name, code) => ({
    subject: 'MindKeep-kirjautumiskoodisi',
    text: [
      `Hei ${name},`,
      '',
      `Kirjautumiskoodisi on ${code}.`,
      'Se vanhenee 10 minuutissa. Jos et yrittänyt kirjautua, voit jättää viestin huomiotta.',
    ].join('\n'),
  }),
};

export function verifyAccountEmail(locale: AppLocale, name: string, link: string): MailCopy {
  return verifyCopy[locale](name, link);
}

export function resetPasswordEmail(locale: AppLocale, name: string, link: string): MailCopy {
  return resetCopy[locale](name, link);
}

export function loginCodeEmail(locale: AppLocale, name: string, code: string): MailCopy {
  return loginCodeCopy[locale](name, code);
}
