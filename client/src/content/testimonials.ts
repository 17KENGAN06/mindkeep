import type { AppLanguage } from '@/i18n';

export type Testimonial = {
  name: string;
  location: string;
  quote: string;
  rating: 4 | 5;
};

type PersonId =
  | 'jussi'
  | 'emma'
  | 'oleksandr'
  | 'patrick'
  | 'sanna'
  | 'charlotte'
  | 'maria'
  | 'eero'
  | 'daniel'
  | 'iryna';

const people: Record<PersonId, { name: string; rating: 4 | 5 }> = {
  jussi: { name: 'Jussi Korhonen', rating: 5 },
  emma: { name: 'Emma Williams', rating: 5 },
  oleksandr: { name: 'Олександр Мельник', rating: 4 },
  patrick: { name: "Patrick O'Connor", rating: 4 },
  sanna: { name: 'Sanna Lehtinen', rating: 5 },
  charlotte: { name: 'Charlotte Evans', rating: 5 },
  maria: { name: 'Марія Коваль', rating: 5 },
  eero: { name: 'Eero Virtanen', rating: 5 },
  daniel: { name: 'Daniel Hughes', rating: 4 },
  iryna: { name: 'Ірина Шевченко', rating: 5 },
};

const copy: Record<AppLanguage, Record<PersonId, { location: string; quote: string }>> = {
  en: {
    jussi: {
      location: 'Helsinki, Finland',
      quote:
        'Everything is as simple as it gets. I add the material and do not have to think about it again. The design is pleasant too.',
    },
    emma: {
      location: 'London, United Kingdom',
      quote:
        'Really smart idea. Notes usually just sit there, but here you actually come back to them. The interface is not overloaded at all.',
    },
    oleksandr: {
      location: 'Kyiv, Ukraine',
      quote:
        'At first the repetition schedule was not obvious. After a couple of minutes it clicked, and now it is very convenient to use.',
    },
    patrick: {
      location: 'Dublin, Ireland',
      quote:
        'I would love a phone app. I would use it every day if I could open it with one tap.',
    },
    sanna: {
      location: 'Turku, Finland',
      quote: 'For a beta this looks very solid. Neat, nothing lags, and it is a pleasure to use.',
    },
    charlotte: {
      location: 'Bristol, United Kingdom',
      quote:
        'I like that you do not need a manual. Almost everything is clear right away. Very calm and pleasant interface.',
    },
    maria: {
      location: 'Lviv, Ukraine',
      quote:
        'The spaced reviews themselves won me over. It feels like learning without rush, and that is much nicer than ordinary notes.',
    },
    eero: {
      location: 'Espoo, Finland',
      quote:
        'Beautiful design. I usually ignore that, but here everything looks very tidy. You actually want to come back.',
    },
    daniel: {
      location: 'Birmingham, United Kingdom',
      quote:
        'I would like a bit of review statistics. Apart from that the app left a very good impression.',
    },
    iryna: {
      location: 'Odesa, Ukraine',
      quote: 'Nothing extra. Fast, clear, and it does not distract from the learning itself.',
    },
  },
  ru: {
    jussi: {
      location: 'Хельсинки, Финляндия',
      quote:
        'Понравилось, что всё максимально просто. Добавил материал и больше ни о чём не думаешь. Дизайн тоже приятный.',
    },
    emma: {
      location: 'Лондон, Великобритания',
      quote:
        'Очень классная идея. Обычно заметки просто лежат, а тут к ним реально возвращаешься. Интерфейс вообще не перегружен.',
    },
    oleksandr: {
      location: 'Киев, Украина',
      quote:
        'Сначала не совсем понял, как работают повторения. Через пару минут разобрался и дальше уже всё стало очевидно. Сейчас пользоваться очень удобно.',
    },
    patrick: {
      location: 'Дублин, Ирландия',
      quote:
        'Не хватает приложения для телефона. Я бы пользовался каждый день, если бы можно было открыть его одним нажатием.',
    },
    sanna: {
      location: 'Турку, Финляндия',
      quote: 'Для беты выглядит очень достойно. Всё аккуратно, ничего не тормозит. Пользоваться приятно.',
    },
    charlotte: {
      location: 'Бристоль, Великобритания',
      quote:
        'Понравилось, что не нужно читать инструкцию. Всё понятно почти сразу. Очень спокойный и приятный интерфейс.',
    },
    maria: {
      location: 'Львов, Украина',
      quote:
        'Мне зашла сама идея повторений. Такое ощущение, что учишь без спешки, и это нравится намного больше обычных конспектов.',
    },
    eero: {
      location: 'Эспоо, Финляндия',
      quote:
        'Красивый дизайн. Обычно не обращаю на это внимания, но здесь всё выглядит очень аккуратно. Пользоваться хочется.',
    },
    daniel: {
      location: 'Бирмингем, Великобритания',
      quote:
        'Хотелось бы видеть небольшую статистику по повторениям. А так приложение оставило очень приятное впечатление.',
    },
    iryna: {
      location: 'Одесса, Украина',
      quote: 'Мне понравилось, что ничего лишнего нет. Всё быстро, понятно и не отвлекает от самого обучения.',
    },
  },
  uk: {
    jussi: {
      location: 'Гельсінкі, Фінляндія',
      quote:
        'Подобається, що все максимально просто. Додав матеріал і більше ні про що не думаєш. Дизайн теж приємний.',
    },
    emma: {
      location: 'Лондон, Велика Британія',
      quote:
        'Дуже класна ідея. Зазвичай нотатки просто лежать, а тут до них справді повертаєшся. Інтерфейс зовсім не перевантажений.',
    },
    oleksandr: {
      location: 'Київ, Україна',
      quote:
        'Спочатку не зовсім зрозумів, як працюють повторення. За кілька хвилин розібрався, і далі все стало очевидно. Зараз користуватися дуже зручно.',
    },
    patrick: {
      location: 'Дублін, Ірландія',
      quote:
        'Бракує застосунку для телефону. Користувався б щодня, якби можна було відкрити його одним натисканням.',
    },
    sanna: {
      location: 'Турку, Фінляндія',
      quote: 'Для бети виглядає дуже гідно. Все акуратно, нічого не гальмує. Користуватися приємно.',
    },
    charlotte: {
      location: 'Брістоль, Велика Британія',
      quote:
        'Подобається, що не потрібно читати інструкцію. Все зрозуміло майже одразу. Дуже спокійний і приємний інтерфейс.',
    },
    maria: {
      location: 'Львів, Україна',
      quote:
        'Зайшла сама ідея повторень. Таке відчуття, що вчиш без поспіху, і це подобається набагато більше звичайних конспектів.',
    },
    eero: {
      location: 'Еспоо, Фінляндія',
      quote:
        'Гарний дизайн. Зазвичай не звертаю на це уваги, але тут усе виглядає дуже акуратно. Користуватися хочеться.',
    },
    daniel: {
      location: 'Бірмінгем, Велика Британія',
      quote:
        'Хотілося б бачити невелику статистику з повторень. А так застосунок залишив дуже приємне враження.',
    },
    iryna: {
      location: 'Одеса, Україна',
      quote: 'Подобається, що немає нічого зайвого. Все швидко, зрозуміло і не відволікає від самого навчання.',
    },
  },
  pl: {
    jussi: {
      location: 'Helsinki, Finlandia',
      quote:
        'Wszystko jest maksymalnie proste. Dodaję materiał i nie muszę o tym myśleć. Design też jest przyjemny.',
    },
    emma: {
      location: 'Londyn, Wielka Brytania',
      quote:
        'Naprawdę fajny pomysł. Notatki zwykle leżą, a tutaj faktycznie do nich wracasz. Interfejs w ogóle nie jest przeładowany.',
    },
    oleksandr: {
      location: 'Kijów, Ukraina',
      quote:
        'Na początku powtórki nie były oczywiste. Po kilku minutach złapałem schemat i teraz korzysta się bardzo wygodnie.',
    },
    patrick: {
      location: 'Dublin, Irlandia',
      quote: 'Brakuje aplikacji na telefon. Używałbym jej codziennie, gdyby dało się otworzyć jednym tapnięciem.',
    },
    sanna: {
      location: 'Turku, Finlandia',
      quote: 'Na betę wygląda bardzo solidnie. Schludnie, nic nie zacina i miło się korzysta.',
    },
    charlotte: {
      location: 'Bristol, Wielka Brytania',
      quote:
        'Podoba mi się, że nie trzeba czytać instrukcji. Prawie wszystko jest jasne od razu. Bardzo spokojny interfejs.',
    },
    maria: {
      location: 'Lwów, Ukraina',
      quote:
        'Przekonał mnie sam pomysł powtórek. Czujesz, że uczysz się bez pośpiechu, i to jest dużo przyjemniejsze niż zwykłe notatki.',
    },
    eero: {
      location: 'Espoo, Finlandia',
      quote:
        'Piękny design. Zwykle tego nie zauważam, ale tutaj wszystko wygląda bardzo schludnie. Chce się wracać.',
    },
    daniel: {
      location: 'Birmingham, Wielka Brytania',
      quote: 'Przydałaby się krótka statystyka powtórek. Poza tym aplikacja zostawia bardzo dobre wrażenie.',
    },
    iryna: {
      location: 'Odessa, Ukraina',
      quote: 'Nie ma nic zbędnego. Szybko, jasno i nie odciąga od samej nauki.',
    },
  },
  de: {
    jussi: {
      location: 'Helsinki, Finnland',
      quote:
        'Alles ist so einfach wie möglich. Ich lege das Material an und muss nicht mehr daran denken. Das Design ist auch angenehm.',
    },
    emma: {
      location: 'London, Vereinigtes Königreich',
      quote:
        'Wirklich gute Idee. Notizen liegen sonst nur rum, hier kommt man wirklich zu ihnen zurück. Die Oberfläche ist überhaupt nicht überladen.',
    },
    oleksandr: {
      location: 'Kiew, Ukraine',
      quote:
        'Am Anfang war der Wiederholungsrhythmus nicht klar. Nach ein paar Minuten hat es geklickt, und jetzt ist es sehr bequem.',
    },
    patrick: {
      location: 'Dublin, Irland',
      quote:
        'Eine Handy-App fehlt noch. Ich würde sie jeden Tag nutzen, wenn ich sie mit einem Tipp öffnen könnte.',
    },
    sanna: {
      location: 'Turku, Finnland',
      quote: 'Für eine Beta wirkt das sehr solide. Ordentlich, nichts hängt, und es macht Spaß.',
    },
    charlotte: {
      location: 'Bristol, Vereinigtes Königreich',
      quote:
        'Schön, dass man keine Anleitung braucht. Fast alles ist sofort klar. Sehr ruhige, angenehme Oberfläche.',
    },
    maria: {
      location: 'Lwiw, Ukraine',
      quote:
        'Die Idee der Wiederholungen hat mich überzeugt. Man lernt ohne Hetze, und das ist viel angenehmer als normale Notizen.',
    },
    eero: {
      location: 'Espoo, Finnland',
      quote:
        'Schönes Design. Darauf achte ich sonst kaum, aber hier wirkt alles sehr aufgeräumt. Man will wiederkommen.',
    },
    daniel: {
      location: 'Birmingham, Vereinigtes Königreich',
      quote:
        'Ein bisschen Statistik zu den Wiederholungen wäre schön. Ansonsten hinterlässt die App einen sehr guten Eindruck.',
    },
    iryna: {
      location: 'Odessa, Ukraine',
      quote: 'Nichts Überflüssiges. Schnell, klar und es lenkt nicht vom Lernen ab.',
    },
  },
  fr: {
    jussi: {
      location: 'Helsinki, Finlande',
      quote:
        'Tout est aussi simple que possible. J’ajoute le matériel et je n’ai plus à y penser. Le design est agréable aussi.',
    },
    emma: {
      location: 'Londres, Royaume-Uni',
      quote:
        'Vraiment une belle idée. D’habitude les notes restent là, ici on y revient vraiment. L’interface n’est pas du tout surchargée.',
    },
    oleksandr: {
      location: 'Kyiv, Ukraine',
      quote:
        'Au début le rythme des révisions n’était pas évident. Après quelques minutes, c’est devenu clair, et maintenant c’est très pratique.',
    },
    patrick: {
      location: 'Dublin, Irlande',
      quote:
        'Il manque une appli téléphone. Je l’utiliserais tous les jours si je pouvais l’ouvrir d’un tap.',
    },
    sanna: {
      location: 'Turku, Finlande',
      quote: 'Pour une bêta, c’est très propre. Rien ne rame, et c’est agréable à utiliser.',
    },
    charlotte: {
      location: 'Bristol, Royaume-Uni',
      quote:
        'J’aime qu’on n’ait pas besoin d’un mode d’emploi. Presque tout est clair tout de suite. Interface très calme.',
    },
    maria: {
      location: 'Lviv, Ukraine',
      quote:
        'L’idée des révisions m’a convaincue. On apprend sans se presser, et c’est bien plus agréable que des notes ordinaires.',
    },
    eero: {
      location: 'Espoo, Finlande',
      quote:
        'Beau design. D’habitude je n’y fais pas attention, mais ici tout est très soigné. On a envie d’y revenir.',
    },
    daniel: {
      location: 'Birmingham, Royaume-Uni',
      quote:
        'Un peu de statistiques sur les révisions serait bien. Sinon l’appli laisse une très bonne impression.',
    },
    iryna: {
      location: 'Odessa, Ukraine',
      quote: 'Rien de superflu. Rapide, clair, et ça ne distrait pas de l’apprentissage.',
    },
  },
  it: {
    jussi: {
      location: 'Helsinki, Finlandia',
      quote:
        'Tutto è il più semplice possibile. Aggiungo il materiale e non ci penso più. Anche il design è piacevole.',
    },
    emma: {
      location: 'Londra, Regno Unito',
      quote:
        'Idea davvero bella. Di solito gli appunti restano lì, qui ci torni davvero. L’interfaccia non è affatto sovraccarica.',
    },
    oleksandr: {
      location: 'Kyiv, Ucraina',
      quote:
        'All’inizio le ripetizioni non erano ovvie. Dopo un paio di minuti ho capito, e ora è molto comodo.',
    },
    patrick: {
      location: 'Dublino, Irlanda',
      quote:
        'Manca un’app per il telefono. La userei ogni giorno se potessi aprirla con un tocco.',
    },
    sanna: {
      location: 'Turku, Finlandia',
      quote: 'Per una beta è molto solida. Ordinata, niente lag, e si usa volentieri.',
    },
    charlotte: {
      location: 'Bristol, Regno Unito',
      quote:
        'Mi piace che non serva un manuale. Quasi tutto è chiaro subito. Interfaccia molto calma e piacevole.',
    },
    maria: {
      location: 'Leopoli, Ucraina',
      quote:
        'Mi ha convinto l’idea delle ripetizioni. Impari senza fretta, e piace molto più degli appunti normali.',
    },
    eero: {
      location: 'Espoo, Finlandia',
      quote:
        'Design bello. Di solito non ci faccio caso, ma qui tutto è molto curato. Vieni voglia di tornare.',
    },
    daniel: {
      location: 'Birmingham, Regno Unito',
      quote:
        'Vorrei un po’ di statistiche sulle ripetizioni. Per il resto l’app lascia un’ottima impressione.',
    },
    iryna: {
      location: 'Odessa, Ucraina',
      quote: 'Niente di superfluo. Veloce, chiaro e non distoglie dallo studio.',
    },
  },
  es: {
    jussi: {
      location: 'Helsinki, Finlandia',
      quote:
        'Todo es lo más simple posible. Añado el material y ya no tengo que pensar en ello. El diseño también es agradable.',
    },
    emma: {
      location: 'Londres, Reino Unido',
      quote:
        'Muy buena idea. Las notas suelen quedarse ahí, aquí de verdad vuelves a ellas. La interfaz no está nada recargada.',
    },
    oleksandr: {
      location: 'Kyiv, Ucrania',
      quote:
        'Al principio las repeticiones no eran obvias. En un par de minutos lo entendí y ahora es muy cómodo.',
    },
    patrick: {
      location: 'Dublín, Irlanda',
      quote:
        'Falta una app para el teléfono. La usaría todos los días si pudiera abrirla con un toque.',
    },
    sanna: {
      location: 'Turku, Finlandia',
      quote: 'Para una beta se ve muy sólida. Ordenada, nada se traba y da gusto usarla.',
    },
    charlotte: {
      location: 'Bristol, Reino Unido',
      quote:
        'Me gusta que no haga falta un manual. Casi todo queda claro al momento. Interfaz muy calmada y agradable.',
    },
    maria: {
      location: 'Leópolis, Ucrania',
      quote:
        'Me convenció la idea de las repeticiones. Aprendes sin prisa, y eso gusta mucho más que los apuntes normales.',
    },
    eero: {
      location: 'Espoo, Finlandia',
      quote:
        'Diseño bonito. Normalmente no me fijo, pero aquí todo se ve muy cuidado. Dan ganas de volver.',
    },
    daniel: {
      location: 'Birmingham, Reino Unido',
      quote:
        'Me gustaría un poco de estadísticas de repeticiones. Aparte de eso, la app deja muy buena impresión.',
    },
    iryna: {
      location: 'Odesa, Ucrania',
      quote: 'Nada de más. Rápido, claro y no distrae del aprendizaje.',
    },
  },
  fi: {
    jussi: {
      location: 'Helsinki, Suomi',
      quote:
        'Kaikki on mahdollisimman yksinkertaista. Lisään materiaalin enkä joudu miettimään sitä enää. Ulkoasukin on miellyttävä.',
    },
    emma: {
      location: 'Lontoo, Yhdistynyt kuningaskunta',
      quote:
        'Todella hyvä idea. Muistiinpanot yleensä vain makaavat, täällä niihin oikeasti palataan. Käyttöliittymä ei ole lainkaan täyteen ahdettu.',
    },
    oleksandr: {
      location: 'Kiova, Ukraina',
      quote:
        'Aluksi kertausten rytmi ei ollut selvä. Muutamassa minuutissa se aukesi, ja nyt käyttö on tosi sujuvaa.',
    },
    patrick: {
      location: 'Dublin, Irlanti',
      quote:
        'Puhelinsovellus puuttuu. Käyttäisin sitä joka päivä, jos sen saisi auki yhdellä napautuksella.',
    },
    sanna: {
      location: 'Turku, Suomi',
      quote: 'Betaksi tämä näyttää tosi hyvältä. Siistiä, mikään ei nyi, ja käyttö on miellyttävää.',
    },
    charlotte: {
      location: 'Bristol, Yhdistynyt kuningaskunta',
      quote:
        'Tykkään, ettei ohjetta tarvita. Melkein kaikki on heti selvää. Hyvin rauhallinen ja miellyttävä käyttöliittymä.',
    },
    maria: {
      location: 'Lviv, Ukraina',
      quote:
        'Itse kertausten idea vei mukanaan. Tuntuu, että oppii ilman kiirettä, ja se on paljon mukavampaa kuin tavalliset muistiinpanot.',
    },
    eero: {
      location: 'Espoo, Suomi',
      quote:
        'Kaunis ulkoasu. En yleensä kiinnitä siihen huomiota, mutta täällä kaikki näyttää tosi siistiltä. Tekee mieli palata.',
    },
    daniel: {
      location: 'Birmingham, Yhdistynyt kuningaskunta',
      quote:
        'Pieni kertausstatistiikka olisi kiva. Muuten sovellus jätti tosi hyvän vaikutelman.',
    },
    iryna: {
      location: 'Odessa, Ukraina',
      quote: 'Ei mitään ylimääräistä. Nopeaa, selvää, eikä se vie huomiota itse oppimisesta.',
    },
  },
};

const order: PersonId[] = [
  'jussi',
  'emma',
  'oleksandr',
  'patrick',
  'sanna',
  'charlotte',
  'maria',
  'eero',
  'daniel',
  'iryna',
];

export function getTestimonials(language: AppLanguage): Testimonial[] {
  const localized = copy[language] ?? copy.en;
  return order.map((id) => ({
    name: people[id].name,
    rating: people[id].rating,
    location: localized[id].location,
    quote: localized[id].quote,
  }));
}
