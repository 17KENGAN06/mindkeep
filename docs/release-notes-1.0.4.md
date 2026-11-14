# MindKeep 1.0.4: "What's New" texts

Ship after Apple approves 1.0.3 (build 10). Contents: flat site-style design (cf07d8e), time zone suggestion as a popup, clearer Plans screen for team and beta accounts.

Paste into App Store Connect → 1.0.4 → "What's New in This Version" (EN + RU) and into Google Play → release notes (`<en-US>` / `<ru-RU>`; Play limit 500 characters per language).

## English (en-US)

A fresh look that matches the MindKeep website:
- Cleaner, flat design with the same colours as the site, in light and dark themes
- The time zone suggestion now opens as a small popup instead of a banner on top of your day
- Clearer Plans screen
- Small fixes and improvements

## Русский (ru-RU)

Новый внешний вид, как на сайте MindKeep:
- Более чистый, плоский дизайн в тех же цветах, что и сайт, в светлой и тёмной теме
- Предложение сменить часовой пояс теперь открывается небольшим окном, а не баннером поверх дня
- Более понятный экран тарифов
- Мелкие исправления и улучшения

## Google Play format

```
<en-US>
A fresh look that matches the MindKeep website:
- Cleaner, flat design with the site's colours, in light and dark themes
- The time zone suggestion now opens as a small popup
- Clearer Plans screen
- Small fixes and improvements
</en-US>
<ru-RU>
Новый внешний вид, как на сайте MindKeep:
- Более чистый, плоский дизайн в цветах сайта, в светлой и тёмной теме
- Предложение сменить часовой пояс теперь открывается небольшим окном
- Более понятный экран тарифов
- Мелкие исправления и улучшения
</ru-RU>
```

Note: Android closed testing already has the new design in versionCode 10 (1.0.3). For the Android production release, these notes describe the same changes.

## Release steps (after 1.0.3 approval, each with the owner's yes)

1. `mobile/app.json`: `version` → `1.0.4`, iOS `buildNumber` → next, Android `versionCode` → 11.
2. iOS: `eas build -p ios --profile production --auto-submit`; App Store Connect → "+" new version 1.0.4 → pick the build, paste the notes, submit.
3. Android: `eas build -p android --profile production`, upload the AAB in Play Console, paste the notes.
4. Railway: `LATEST_IOS_BUILD` / `LATEST_ANDROID_VERSION_CODE` → the new numbers once the builds are live (soft update prompt; never touch `MIN_*`).
