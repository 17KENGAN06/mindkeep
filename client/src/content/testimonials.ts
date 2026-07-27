import type { AppLanguage } from '@/i18n';

type LocalizedText = Record<AppLanguage, string>;

export type Testimonial = {
  name: string;
  location: LocalizedText;
  quote: LocalizedText;
  rating: 4 | 5;
};

export const testimonials: Testimonial[] = [
  {
    name: 'Jussi Korhonen',
    rating: 5,
    location: {
      ru: 'Хельсинки, Финляндия',
      en: 'Helsinki, Finland',
      uk: 'Гельсінкі, Фінляндія',
      fi: 'Helsinki, Suomi',
    },
    quote: {
      ru: 'Понравилось, что всё максимально просто. Добавил материал и больше ни о чём не думаешь. Дизайн тоже приятный.',
      en: 'I like how simple everything is. I add a material and do not have to think about it again. The design is pleasant too.',
      uk: 'Сподобалося, що все максимально просто. Додав матеріал і більше ні про що не думаєш. Дизайн теж приємний.',
      fi: 'Pidän siitä, että kaikki on todella helppoa. Lisään materiaalin, eikä minun tarvitse enää miettiä sitä. Myös ulkoasu on miellyttävä.',
    },
  },
  {
    name: 'Emma Williams',
    rating: 5,
    location: {
      ru: 'Лондон, Великобритания',
      en: 'London, United Kingdom',
      uk: 'Лондон, Велика Британія',
      fi: 'Lontoo, Iso-Britannia',
    },
    quote: {
      ru: 'Очень классная идея. Обычно заметки просто лежат, а тут к ним реально возвращаешься. Интерфейс вообще не перегружен.',
      en: 'It is a great idea. Notes usually just sit there, but this actually brings you back to them. The interface does not feel cluttered at all.',
      uk: 'Дуже класна ідея. Зазвичай нотатки просто лежать, а тут до них справді повертаєшся. Інтерфейс зовсім не перевантажений.',
      fi: 'Todella hyvä idea. Yleensä muistiinpanot vain jäävät lojumaan, mutta täällä niihin tulee oikeasti palattua. Käyttöliittymä ei ole yhtään sekava.',
    },
  },
  {
    name: 'Олександр Мельник',
    rating: 4,
    location: {
      ru: 'Киев, Украина',
      en: 'Kyiv, Ukraine',
      uk: 'Київ, Україна',
      fi: 'Kiova, Ukraina',
    },
    quote: {
      ru: 'Сначала не совсем понял, как работают повторения. Через пару минут разобрался и дальше уже всё стало очевидно. Сейчас пользоваться очень удобно.',
      en: 'At first I did not fully understand how the reviews worked. It took a couple of minutes to figure out, and after that everything was clear. Now it is very convenient to use.',
      uk: 'Спочатку не зовсім зрозумів, як працюють повторення. За кілька хвилин розібрався, і далі все стало очевидно. Зараз користуватися дуже зручно.',
      fi: 'Aluksi en täysin ymmärtänyt, miten kertaukset toimivat. Parin minuutin jälkeen asia selvisi, ja sen jälkeen kaikki oli selvää. Nyt käyttö on todella helppoa.',
    },
  },
  {
    name: "Patrick O'Connor",
    rating: 4,
    location: {
      ru: 'Дублин, Ирландия',
      en: 'Dublin, Ireland',
      uk: 'Дублін, Ірландія',
      fi: 'Dublin, Irlanti',
    },
    quote: {
      ru: 'Не хватает приложения для телефона. Я бы пользовался каждый день, если бы можно было открыть его одним нажатием.',
      en: 'I miss having a mobile app. I would use it every day if I could open it with one tap.',
      uk: 'Не вистачає застосунку для телефона. Я б користувався щодня, якби його можна було відкрити одним натисканням.',
      fi: 'Kaipaan puhelinsovellusta. Käyttäisin sitä joka päivä, jos sen voisi avata yhdellä napautuksella.',
    },
  },
  {
    name: 'Sanna Lehtinen',
    rating: 5,
    location: {
      ru: 'Турку, Финляндия',
      en: 'Turku, Finland',
      uk: 'Турку, Фінляндія',
      fi: 'Turku, Suomi',
    },
    quote: {
      ru: 'Для беты выглядит очень достойно. Всё аккуратно, ничего не тормозит. Пользоваться приятно.',
      en: 'It looks very polished for a beta. Everything is tidy, nothing feels slow, and it is pleasant to use.',
      uk: 'Для бета-версії виглядає дуже гідно. Усе акуратно, нічого не гальмує. Користуватися приємно.',
      fi: 'Betaversioksi tämä näyttää todella viimeistellyltä. Kaikki on siistiä, mikään ei hidastele ja käyttö tuntuu miellyttävältä.',
    },
  },
  {
    name: 'Charlotte Evans',
    rating: 5,
    location: {
      ru: 'Бристоль, Великобритания',
      en: 'Bristol, United Kingdom',
      uk: 'Бристоль, Велика Британія',
      fi: 'Bristol, Iso-Britannia',
    },
    quote: {
      ru: 'Понравилось, что не нужно читать инструкцию. Всё понятно почти сразу. Очень спокойный и приятный интерфейс.',
      en: 'I like that there is no need to read a manual. Almost everything is clear right away. The interface feels calm and pleasant.',
      uk: 'Сподобалося, що не потрібно читати інструкцію. Усе зрозуміло майже одразу. Дуже спокійний і приємний інтерфейс.',
      fi: 'Pidän siitä, ettei käyttöohjetta tarvitse lukea. Lähes kaikki on selvää heti. Käyttöliittymä on rauhallinen ja miellyttävä.',
    },
  },
  {
    name: 'Марія Коваль',
    rating: 5,
    location: {
      ru: 'Львов, Украина',
      en: 'Lviv, Ukraine',
      uk: 'Львів, Україна',
      fi: 'Lviv, Ukraina',
    },
    quote: {
      ru: 'Мне зашла сама идея повторений. Такое ощущение, что учишь без спешки, и это нравится намного больше обычных конспектов.',
      en: 'I really like the review idea. It feels like learning without rushing, and I enjoy that much more than ordinary notes.',
      uk: 'Мені дуже сподобалася сама ідея повторень. Таке відчуття, що навчаєшся без поспіху, і це подобається значно більше за звичайні конспекти.',
      fi: 'Pidän todella paljon kertausideasta. Oppiminen tuntuu kiireettömältä, ja se sopii minulle paljon paremmin kuin tavalliset muistiinpanot.',
    },
  },
  {
    name: 'Eero Virtanen',
    rating: 5,
    location: {
      ru: 'Эспоо, Финляндия',
      en: 'Espoo, Finland',
      uk: 'Еспоо, Фінляндія',
      fi: 'Espoo, Suomi',
    },
    quote: {
      ru: 'Красивый дизайн. Обычно не обращаю на это внимания, но здесь всё выглядит очень аккуратно. Пользоваться хочется.',
      en: 'The design looks great. I do not usually pay much attention to that, but everything here feels very polished. It makes me want to keep using it.',
      uk: 'Гарний дизайн. Зазвичай не звертаю на це уваги, але тут усе виглядає дуже акуратно. Хочеться користуватися далі.',
      fi: 'Kaunis ulkoasu. En yleensä kiinnitä siihen paljon huomiota, mutta täällä kaikki näyttää todella huolitellulta. Tätä tekee mieli käyttää.',
    },
  },
  {
    name: 'Daniel Hughes',
    rating: 4,
    location: {
      ru: 'Бирмингем, Великобритания',
      en: 'Birmingham, United Kingdom',
      uk: 'Бірмінгем, Велика Британія',
      fi: 'Birmingham, Iso-Britannia',
    },
    quote: {
      ru: 'Тёмная тема вообще огонь. Выглядит очень атмосферно и современно. А вот дизайн светлой версии я бы немного пересмотрел, потому что по сравнению с тёмной она нравится мне заметно меньше.',
      en: 'The dark theme is brilliant. It feels atmospheric and modern. I would reconsider the light theme a little, because I like it noticeably less than the dark version.',
      uk: 'Темна тема просто вогонь. Виглядає дуже атмосферно й сучасно. А от дизайн світлої версії я б трохи переглянув, бо порівняно з темною вона подобається мені значно менше.',
      fi: 'Tumma teema on todella hieno. Se näyttää tunnelmalliselta ja modernilta. Vaaleaa teemaa muuttaisin hieman, sillä pidän siitä selvästi vähemmän kuin tummasta versiosta.',
    },
  },
  {
    name: 'Ірина Шевченко',
    rating: 5,
    location: {
      ru: 'Одесса, Украина',
      en: 'Odesa, Ukraine',
      uk: 'Одеса, Україна',
      fi: 'Odesa, Ukraina',
    },
    quote: {
      ru: 'Мне понравилось, что ничего лишнего нет. Всё быстро, понятно и не отвлекает от самого обучения.',
      en: 'I like that there is nothing unnecessary. Everything is fast, clear and does not distract from learning itself.',
      uk: 'Мені сподобалося, що немає нічого зайвого. Усе швидко, зрозуміло й не відволікає від самого навчання.',
      fi: 'Pidän siitä, ettei mukana ole mitään turhaa. Kaikki on nopeaa ja selkeää eikä vie huomiota itse oppimisesta.',
    },
  },
];
