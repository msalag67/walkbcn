// Activities: hand-picked places, shown by category and filters.
// No live availability and no booking inside WalkBCN: "See on Google Maps" opens a Maps
// search for the place, where its own website and opening times are listed.
// lat/lng: map position, looked up on OpenStreetMap (Nominatim) by name or address.
// Editorial rules: local, family or independent businesses only (no chains, no places aimed
// mainly at expats), no commissions or affiliate links. Price bands (restaurants) are per
// person for a meal with one drink, see priceNote. A business's history and its current owners
// can differ: say so in the description (e.g. Can Lluís, reopened in 2025 by new owners).
// Places added from 14 Nov 2026 carry `why` (reason for choosing it), `priceEvidence` and
// `sources` with the date checked; they are maintained in content/manual/_activities.json
// and applied by scripts/import-manual.mjs. Older places were checked on OpenStreetMap.
// Nightlife "dress" is a guide (smart / smartcasual / casual); door policies change.
window.WALKBCN_ACTIVITIES = {
  "restaurants": {
    "label": "Restaurants",
    "img": "Tapas en El Raval.jpg",
    "intro": "Tell us what you feel like eating. We'll suggest places worth the trip.",
    "filters": [
      {
        "id": "food",
        "label": "What kind of food?",
        "options": [
          {
            "id": "catalan",
            "label": "Catalan cooking"
          },
          {
            "id": "tapas",
            "label": "Tapas"
          },
          {
            "id": "seafood",
            "label": "Seafood"
          },
          {
            "id": "rice",
            "label": "Rice dishes (arrossos)"
          },
          {
            "id": "esmorzar",
            "label": "Fork breakfast (esmorzar)"
          },
          {
            "id": "menu",
            "label": "Menú del dia (set lunch)"
          },
          {
            "id": "veggie",
            "label": "Vegetarian options"
          }
        ]
      },
      {
        "id": "area",
        "label": "Where?",
        "options": [
          {
            "id": "gothic-born",
            "label": "Gothic & Born"
          },
          {
            "id": "raval",
            "label": "Raval"
          },
          {
            "id": "eixample",
            "label": "Eixample"
          },
          {
            "id": "gracia",
            "label": "Gràcia"
          },
          {
            "id": "barceloneta",
            "label": "Barceloneta"
          },
          {
            "id": "poble-sec",
            "label": "Poble-sec"
          },
          {
            "id": "sant-gervasi",
            "label": "Sant Gervasi & Tibidabo"
          }
        ]
      },
      {
        "id": "price",
        "label": "Budget",
        "options": [
          {
            "id": "1",
            "label": "€"
          },
          {
            "id": "2",
            "label": "€€"
          },
          {
            "id": "3",
            "label": "€€€"
          }
        ]
      }
    ],
    "places": [
      {
        "name": "Can Culleretes",
        "lat": 41.38121,
        "lng": 2.17442,
        "area": "gothic-born",
        "price": "2",
        "food": [
          "catalan"
        ],
        "desc": "Open since 1786 and often called the oldest restaurant in Barcelona. Traditional Catalan dishes in tiled, old-fashioned dining rooms."
      },
      {
        "name": "Els Quatre Gats",
        "lat": 41.38574,
        "lng": 2.17364,
        "area": "gothic-born",
        "price": "3",
        "food": [
          "catalan"
        ],
        "desc": "The Modernista café where a young Picasso held his first exhibition in 1900. Catalan cooking in one of the city's most beautiful rooms."
      },
      {
        "name": "El Xampanyet",
        "lat": 41.38451,
        "lng": 2.18167,
        "area": "gothic-born",
        "price": "1",
        "food": [
          "tapas"
        ],
        "desc": "Tiny, always-busy bar on Carrer de Montcada, by the Picasso Museum. Come for the house cava and simple tapas, and expect to stand."
      },
      {
        "name": "Cal Pep",
        "lat": 41.38394,
        "lng": 2.18333,
        "area": "gothic-born",
        "price": "3",
        "food": [
          "seafood",
          "tapas"
        ],
        "desc": "Counter seats and fresh seafood tapas cooked right in front of you. Popular for a reason, so arrive early or be ready to queue."
      },
      {
        "name": "Bar del Pla",
        "lat": 41.3856,
        "lng": 2.18002,
        "area": "gothic-born",
        "price": "2",
        "food": [
          "tapas"
        ],
        "desc": "Relaxed Born bar mixing classic and creative tapas, with a good wine list. A favourite with locals."
      },
      {
        "name": "Bar Cañete",
        "lat": 41.37914,
        "lng": 2.17314,
        "area": "raval",
        "price": "3",
        "food": [
          "tapas",
          "seafood"
        ],
        "desc": "Lively, polished counter bar near the Liceu opera house, serving classic tapas done very well."
      },
      {
        "name": "Quimet & Quimet",
        "lat": 41.37422,
        "lng": 2.16574,
        "area": "poble-sec",
        "price": "2",
        "food": [
          "tapas",
          "seafood"
        ],
        "desc": "Standing-room family bar with walls of bottles, famous for little montaditos built from top-quality preserved seafood."
      },
      {
        "name": "Bar Mut",
        "lat": 41.3973,
        "lng": 2.16128,
        "area": "eixample",
        "price": "3",
        "food": [
          "tapas",
          "seafood"
        ],
        "desc": "Small, upmarket bar with a chalkboard menu that changes with the market. Ideal for a special evening."
      },
      {
        "name": "Cervecería Catalana",
        "lat": 41.3924,
        "lng": 2.1609,
        "area": "eixample",
        "price": "2",
        "food": [
          "tapas"
        ],
        "desc": "Big, buzzing tapas bar loved by locals and visitors alike. Go early or expect a wait."
      },
      {
        "name": "La Pubilla",
        "lat": 41.39957,
        "lng": 2.15367,
        "area": "gracia",
        "price": "2",
        "food": [
          "catalan",
          "esmorzar",
          "menu"
        ],
        "desc": "Next to the Mercat de la Llibertat. Hearty Catalan market cooking, best known for its traditional \"fork breakfasts\".",
        "note": "esmorzar-menu"
      },
      {
        "name": "La Pepita",
        "lat": 41.39796,
        "lng": 2.16102,
        "area": "gracia",
        "price": "2",
        "food": [
          "tapas",
          "veggie"
        ],
        "desc": "Cosy Gràcia bar with creative tapas, including good vegetarian options, in a relaxed neighbourhood setting."
      },
      {
        "name": "La Cova Fumada",
        "lat": 41.3793,
        "lng": 2.18919,
        "area": "barceloneta",
        "price": "1",
        "food": [
          "tapas",
          "seafood"
        ],
        "desc": "Family-run bar with no sign outside, credited with inventing the \"bomba\", a potato croquette with spicy sauce."
      },
      {
        "name": "Can Solé",
        "lat": 41.3789,
        "lng": 2.18837,
        "area": "barceloneta",
        "price": "3",
        "food": [
          "seafood",
          "rice"
        ],
        "desc": "A Barceloneta classic for over a century, known for seafood, rice dishes and paella."
      },
      {
        "name": "Can Paixano",
        "lat": 41.38178,
        "lng": 2.18343,
        "area": "barceloneta",
        "price": "1",
        "food": [
          "tapas"
        ],
        "desc": "Packed standing bar serving cheap house cava and grilled sandwiches. Loud, crowded and great fun."
      },
      {
        "name": "La Venta",
        "lat": 41.41624,
        "lng": 2.1317,
        "area": "sant-gervasi",
        "price": "3",
        "food": [
          "catalan"
        ],
        "desc": "Classic restaurant at the foot of Tibidabo, with a glassed-in terrace and views over the whole city. A special-occasion favourite of locals."
      },
      {
        "name": "Via Veneto",
        "lat": 41.39246,
        "lng": 2.13907,
        "area": "sant-gervasi",
        "price": "3",
        "food": [
          "catalan"
        ],
        "desc": "Elegant, old-school fine dining in Sant Gervasi, serving refined Catalan cooking since the 1960s."
      },
      {
        "name": "Botafumeiro",
        "lat": 41.4004,
        "lng": 2.15464,
        "area": "gracia",
        "price": "3",
        "food": [
          "seafood"
        ],
        "desc": "Long-established Galician seafood restaurant on Carrer Gran de Gràcia, with white-jacketed waiters and a famous seafood bar."
      },
      {
        "name": "7 Portes",
        "lat": 41.38217,
        "lng": 2.18325,
        "area": "gothic-born",
        "price": "3",
        "food": [
          "seafood",
          "rice",
          "catalan"
        ],
        "desc": "Opened in 1836 and famous for its rice dishes and paella, served in grand, old-fashioned dining rooms."
      },
      {
        "name": "Can Majó",
        "lat": 41.37752,
        "lng": 2.19089,
        "area": "barceloneta",
        "price": "3",
        "food": [
          "seafood",
          "rice"
        ],
        "desc": "Seafood and rice dishes by the beach in Barceloneta, run by the same family for decades."
      },
      {
        "name": "Casa Delfín",
        "lat": 41.38521,
        "lng": 2.18336,
        "area": "gothic-born",
        "price": "2",
        "food": [
          "catalan",
          "tapas"
        ],
        "desc": "Classic Catalan dishes and seasonal tapas on the Passeig del Born, popular with people from the neighbourhood."
      },
      {
        "name": "Can Ramonet",
        "lat": 41.38082,
        "lng": 2.18892,
        "area": "barceloneta",
        "price": "2",
        "food": [
          "seafood",
          "tapas"
        ],
        "desc": "One of the oldest taverns in Barceloneta, with wine barrels as tables and seafood tapas."
      },
      {
        "name": "Bodega La Peninsular",
        "lat": 41.38024,
        "lng": 2.1878,
        "area": "barceloneta",
        "price": "2",
        "food": [
          "tapas",
          "seafood"
        ],
        "desc": "A bodega-style bar in Barceloneta with classic tapas and seafood, full of locals at vermouth time."
      },
      {
        "name": "Bodega Sepúlveda",
        "lat": 41.38348,
        "lng": 2.16257,
        "area": "eixample",
        "price": "2",
        "food": [
          "tapas"
        ],
        "desc": "Busy, no-frills bodega in Sant Antoni with a long list of traditional and creative tapas."
      },
      {
        "name": "El Glop",
        "lat": 41.38945,
        "lng": 2.17062,
        "area": "gracia",
        "price": "2",
        "food": [
          "catalan"
        ],
        "desc": "Rustic Catalan tavern in Gràcia, known for grilled meats and calçots in season."
      },
      {
        "name": "Bar La Plata",
        "lat": 41.3804,
        "lng": 2.18059,
        "area": "gothic-born",
        "price": "1",
        "food": [
          "tapas",
          "seafood"
        ],
        "desc": "Tiny bar open since 1945 serving almost only four things: fried fish, a tomato salad, botifarra and anchovies, with local wine from the barrel."
      },
      {
        "name": "La Bombeta",
        "lat": 41.38057,
        "lng": 2.18771,
        "area": "barceloneta",
        "price": "1",
        "food": [
          "tapas"
        ],
        "desc": "No-nonsense Barceloneta bar famous for its bombas and patatas bravas."
      },
      {
        "name": "Bodega Quimet",
        "lat": 41.39922,
        "lng": 2.15464,
        "area": "gracia",
        "price": "1",
        "food": [
          "tapas"
        ],
        "desc": "Old bodega in Gràcia with barrels, vermouth on tap and simple tapas."
      },
      {
        "name": "Bar Tomàs",
        "lat": 41.39755,
        "lng": 2.12308,
        "area": "sant-gervasi",
        "price": "1",
        "food": [
          "tapas"
        ],
        "desc": "Neighbourhood bar in Sarrià whose patatas bravas many locals call the best in the city."
      },
      {
        "name": "Bodega l'Electricitat",
        "lat": 41.37935,
        "lng": 2.19002,
        "area": "barceloneta",
        "price": "1",
        "food": [
          "tapas"
        ],
        "desc": "Barceloneta bodega for a vermouth and a few simple tapas, the way neighbours do on weekends."
      },
      {
        "name": "Can Vilaró",
        "lat": 41.3779,
        "lng": 2.1617,
        "area": "eixample",
        "price": "1",
        "food": [
          "catalan",
          "esmorzar"
        ],
        "note": "mornings",
        "why": "Long-running neighbourhood bar-restaurant in Sant Antoni for popular Catalan cooking at fair prices.",
        "priceEvidence": "Low-priced classic dishes (VilaWeb); a 13 € weekday menu is reported by a third-party guide, not confirmed.",
        "sources": [
          {
            "url": "https://www.vilaweb.cat/noticies/can-vilaro-el-cap-i-pota-i-els-plats-de-sempre-que-mai-no-fallen/",
            "checked": "2026-11-14"
          },
          {
            "url": "https://barcelona.cat/ciutatcuidadora/es/detail/75990331633",
            "checked": "2026-11-14"
          }
        ],
        "desc": "Neighbourhood bar-restaurant in Sant Antoni for classic Catalan cooking, from cap i pota to hearty fork breakfasts. Open Monday to Saturday, until mid-afternoon."
      },
      {
        "name": "Bar Gelida",
        "lat": 41.3829,
        "lng": 2.157,
        "area": "eixample",
        "price": "1",
        "food": [
          "catalan"
        ],
        "why": "Family bar since 1946, run by the founder's grandson, with home-style Catalan dishes.",
        "priceEvidence": "Most dishes under 6 € (Time Out); average around 15 € (Directo al Paladar).",
        "sources": [
          {
            "url": "https://www.timeout.es/barcelona/es/restaurantes/gelida",
            "checked": "2026-11-14"
          },
          {
            "url": "https://www.vilaweb.cat/noticies/del-gelida-al-migrat-cal-que-tot-canvii-perque-tot-continui-igual/",
            "checked": "2026-11-14"
          }
        ],
        "desc": "Family bar in the Eixample since 1946, now run by the founder's grandson. No set menu: a long list of home-style Catalan dishes, plus daily specials on the board from about 1 pm."
      },
      {
        "name": "Bar Bodega Can Ros",
        "lat": 41.405,
        "lng": 2.1642,
        "area": "gracia",
        "price": "1",
        "food": [
          "tapas",
          "esmorzar",
          "catalan"
        ],
        "note": "mornings",
        "why": "Neighbourhood bodega founded in 1971 and still run by the founder's sons; listed by the city's local-commerce programme.",
        "priceEvidence": "Neighbourhood bodega prices (city local-commerce listing, Time Out).",
        "sources": [
          {
            "url": "https://ajuntament.barcelona.cat/comerc/en/bar-bodega-can-ros",
            "checked": "2026-11-14"
          },
          {
            "url": "https://www.timeout.es/barcelona/es/restaurantes/bar-bodega-can-ros",
            "checked": "2026-11-14"
          }
        ],
        "desc": "Bodega founded in 1971 by Esteve Ros and run by his sons, home to a local Sant Medir festival group. Traditional tapas and fork breakfasts, on Carrer de Roger de Flor."
      },
      {
        "name": "La Sosenga",
        "lat": 41.386,
        "lng": 2.1742,
        "area": "gothic-born",
        "price": "2",
        "food": [
          "catalan"
        ],
        "why": "Small independent restaurant (opened 2023) cooking contemporary Catalan food from seasonal produce.",
        "priceEvidence": "€€ in Time Out's listing.",
        "sources": [
          {
            "url": "https://www.timeout.es/barcelona/es/restaurantes/la-sosenga",
            "checked": "2026-11-14"
          },
          {
            "url": "https://thisisbarcelona.com/gastronomy/restaurants/la-sosenga",
            "checked": "2026-11-14"
          }
        ],
        "desc": "Small restaurant opened in 2023 near the cathedral, cooking contemporary Catalan food from seasonal produce. Its name comes from a dish in the medieval Catalan cookbook Sent Soví."
      },
      {
        "name": "Can Lluís",
        "lat": 41.3781,
        "lng": 2.1654,
        "area": "raval",
        "price": "2",
        "food": [
          "catalan"
        ],
        "why": "Raval restaurant founded in 1929; closed in 2021 and reopened in December 2025 under new owners who kept its traditional Catalan cooking.",
        "priceEvidence": "Traditional house menu at 28.90 € (New Barcelona Post, Aug 2026).",
        "sources": [
          {
            "url": "https://www.canlluis.com/",
            "checked": "2026-11-14"
          },
          {
            "url": "https://www.thenewbarcelonapost.com/en/the-resurrection-of-can-lluis-in-barcelona/",
            "checked": "2026-11-14"
          }
        ],
        "desc": "Raval restaurant founded in 1929. It closed in 2021 and reopened in December 2025 with new owners, who kept its traditional Catalan cooking. Open every day for lunch and dinner."
      },
      {
        "name": "Biocenter",
        "lat": 41.3826,
        "lng": 2.1694,
        "area": "raval",
        "price": "2",
        "food": [
          "veggie",
          "menu"
        ],
        "note": "weekdayMenu",
        "why": "Family-run vegetarian and vegan restaurant open since 1980, one of the oldest in the city.",
        "priceEvidence": "Weekday lunch menu 16.50 € incl. water or a glass of wine; à la carte mains about 10–15 € (restaurant's own menu page).",
        "sources": [
          {
            "url": "https://www.restaurantebiocenter.es/carta-menu",
            "checked": "2026-11-14"
          },
          {
            "url": "https://www.restaurantebiocenter.es/",
            "checked": "2026-11-14"
          }
        ],
        "desc": "Family-run vegetarian restaurant in the Raval since 1980, with vegan dishes marked on the menu and a weekday lunch menu."
      },
      {
        "name": "Veg World India",
        "lat": 41.4046,
        "lng": 2.1607,
        "area": "gracia",
        "food": [
          "veggie"
        ],
        "why": "Family-run vegetarian Indian restaurant in Gràcia since 2005 (about 90% of the menu is vegan).",
        "priceEvidence": "No current prices published (menu images dated 2023), so no price band is shown.",
        "sources": [
          {
            "url": "https://www.vegworld.es/",
            "checked": "2026-11-14"
          }
        ],
        "desc": "Family-run vegetarian Indian restaurant in Gràcia since 2005; most of the menu is vegan. Closed on Mondays."
      }
    ],
    "priceNote": {
      "en": "Per person for a meal with one drink: € under 20 €, €€ 20–40 €, €€€ over 40 €. A guide, not a quote.",
      "ca": "Per persona, un àpat amb una beguda: € menys de 20 €, €€ de 20 a 40 €, €€€ més de 40 €. És orientatiu.",
      "es": "Por persona, una comida con una bebida: € menos de 20 €, €€ de 20 a 40 €, €€€ más de 40 €. Es orientativo.",
      "fr": "Par personne, un repas avec une boisson : € moins de 20 €, €€ de 20 à 40 €, €€€ plus de 40 €. À titre indicatif.",
      "de": "Pro Person für ein Essen mit einem Getränk: € unter 20 €, €€ 20–40 €, €€€ über 40 €. Nur ein Richtwert.",
      "it": "A persona, un pasto con una bevanda: € meno di 20 €, €€ 20–40 €, €€€ oltre 40 €. Solo indicativo.",
      "zh": "每人一餐含一杯饮料：€ 低于20欧元，€€ 20–40欧元，€€€ 高于40欧元。仅供参考。"
    },
    "notes": {
      "esmorzar-menu": {
        "en": "Fork breakfasts in the morning and a set lunch on weekdays; check the day's board.",
        "ca": "Esmorzars de forquilla al matí i menú de migdia entre setmana; mira la pissarra del dia.",
        "es": "Esmorzars de forquilla por la mañana y menú de mediodía entre semana; mira la pizarra del día.",
        "fr": "Petits-déjeuners copieux le matin et menu du midi en semaine ; regardez l'ardoise du jour.",
        "de": "Morgens herzhaftes Frühstück, werktags ein Mittagsmenü; schau auf die Tafel des Tages.",
        "it": "Colazioni salate al mattino e menù del pranzo nei giorni feriali; guarda la lavagna del giorno.",
        "zh": "早上供应丰盛早午餐，工作日中午有套餐；请看当天的黑板菜单。"
      },
      "mornings": {
        "en": "Esmorzars are served in the morning; check opening days before going.",
        "ca": "Els esmorzars se serveixen al matí; consulta els dies d'obertura abans d'anar-hi.",
        "es": "Los esmorzars se sirven por la mañana; consulta los días de apertura antes de ir.",
        "fr": "Les esmorzars se servent le matin ; vérifiez les jours d'ouverture avant d'y aller.",
        "de": "Esmorzars gibt es morgens; prüf vorher die Öffnungstage.",
        "it": "Gli esmorzars si servono al mattino; controlla i giorni di apertura prima di andare.",
        "zh": "早午餐在上午供应；出发前请查询营业日。"
      },
      "weekdayMenu": {
        "en": "The set lunch menu is served Monday to Friday at midday.",
        "ca": "El menú de migdia se serveix de dilluns a divendres.",
        "es": "El menú de mediodía se sirve de lunes a viernes.",
        "fr": "Le menu du midi est servi du lundi au vendredi.",
        "de": "Das Mittagsmenü gibt es Montag bis Freitag.",
        "it": "Il menù del pranzo si serve dal lunedì al venerdì.",
        "zh": "午市套餐周一至周五中午供应。"
      }
    }
  },
  "nightlife": {
    "label": "Nightlife",
    "img": "Plaça Reial at night (3411149452).jpg",
    "intro": "Pick your kind of night. Dress codes are a guide: door policies change, so dress up a little if in doubt. Barcelona's nightlife sits in residential streets, so keep it down when you head home.",
    "filters": [
      {
        "id": "vibe",
        "label": "What kind of night?",
        "options": [
          {
            "id": "cocktail",
            "label": "Cocktail bars"
          },
          {
            "id": "live",
            "label": "Live music"
          },
          {
            "id": "club",
            "label": "Clubs"
          }
        ]
      },
      {
        "id": "style",
        "label": "What atmosphere?",
        "options": [
          {
            "id": "upscale",
            "label": "Upscale (pijo)"
          },
          {
            "id": "casual",
            "label": "Casual"
          },
          {
            "id": "alternative",
            "label": "Alternative"
          }
        ]
      },
      {
        "id": "crowd",
        "label": "Who goes?",
        "options": [
          {
            "id": "locals",
            "label": "Mostly locals"
          },
          {
            "id": "mixed",
            "label": "Locals & visitors"
          }
        ]
      },
      {
        "id": "music",
        "label": "Music",
        "options": [
          {
            "id": "jazz",
            "label": "Jazz & soul"
          },
          {
            "id": "latin",
            "label": "Flamenco & latin"
          },
          {
            "id": "indie",
            "label": "Indie & rock"
          },
          {
            "id": "electronic",
            "label": "Electronic"
          },
          {
            "id": "commercial",
            "label": "Commercial & reggaeton"
          }
        ]
      },
      {
        "id": "area",
        "label": "Where?",
        "options": [
          {
            "id": "gothic-born",
            "label": "Gothic & Born"
          },
          {
            "id": "raval",
            "label": "Raval"
          },
          {
            "id": "eixample",
            "label": "Eixample"
          },
          {
            "id": "poble-sec",
            "label": "Poble-sec"
          },
          {
            "id": "poblenou",
            "label": "Poblenou"
          },
          {
            "id": "sant-gervasi",
            "label": "Tuset, Sant Gervasi & Diagonal"
          }
        ]
      }
    ],
    "places": [
      {
        "name": "Boadas",
        "lat": 41.38466,
        "lng": 2.17027,
        "area": "raval",
        "vibe": [
          "cocktail"
        ],
        "music": [],
        "desc": "Barcelona's oldest cocktail bar, open since 1933, just off the Rambla. Classic drinks from bartenders in white jackets.",
        "style": [
          "upscale"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "smartcasual"
      },
      {
        "name": "Dry Martini",
        "lat": 41.39274,
        "lng": 2.154,
        "area": "eixample",
        "vibe": [
          "cocktail"
        ],
        "music": [],
        "desc": "Wood-panelled classic with a serious reputation for, unsurprisingly, its martinis.",
        "style": [
          "upscale"
        ],
        "crowd": [
          "locals"
        ],
        "dress": "smartcasual"
      },
      {
        "name": "Paradiso",
        "lat": 41.38367,
        "lng": 2.1837,
        "area": "gothic-born",
        "vibe": [
          "cocktail"
        ],
        "music": [],
        "desc": "Speakeasy hidden behind a fridge door in a small pastrami bar. Theatrical, inventive cocktails, often with a queue.",
        "style": [
          "upscale"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "smartcasual"
      },
      {
        "name": "Two Schmucks",
        "lat": 41.38312,
        "lng": 2.16527,
        "area": "raval",
        "vibe": [
          "cocktail"
        ],
        "music": [],
        "desc": "Laid-back, playful cocktail bar with a party atmosphere and no dress code.",
        "style": [
          "casual"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "casual"
      },
      {
        "name": "Bar Marsella",
        "lat": 41.37824,
        "lng": 2.17124,
        "area": "raval",
        "vibe": [
          "cocktail"
        ],
        "music": [],
        "desc": "Open since 1820 and famous for absinthe. Faded mirrors, dusty bottles and plenty of old-world character.",
        "style": [
          "alternative"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "casual"
      },
      {
        "name": "Jamboree",
        "lat": 41.37971,
        "lng": 2.17519,
        "area": "gothic-born",
        "vibe": [
          "live",
          "club"
        ],
        "music": [
          "jazz"
        ],
        "desc": "Legendary jazz cellar on Plaça Reial. Concerts in the evening, then it turns into a club late at night.",
        "style": [
          "casual"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "casual"
      },
      {
        "name": "Jazz Si Club",
        "lat": 41.37982,
        "lng": 2.16414,
        "area": "raval",
        "vibe": [
          "live"
        ],
        "music": [
          "jazz",
          "latin"
        ],
        "desc": "Tiny, low-cost music bar run by a music school, with jam sessions in different styles through the week.",
        "style": [
          "alternative",
          "casual"
        ],
        "crowd": [
          "locals"
        ],
        "dress": "casual"
      },
      {
        "name": "Los Tarantos",
        "lat": 41.37974,
        "lng": 2.17515,
        "area": "gothic-born",
        "vibe": [
          "live"
        ],
        "music": [
          "latin"
        ],
        "desc": "Barcelona's oldest flamenco tablao, on Plaça Reial since 1963, with short shows of about 40 minutes. Flamenco was born in Andalusia; in Barcelona it took root through migration and the city's Roma (gitano) community, which also gave the city Catalan rumba.",
        "style": [
          "casual"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "casual"
      },
      {
        "name": "Marula Café",
        "lat": 41.38015,
        "lng": 2.17685,
        "area": "gothic-born",
        "vibe": [
          "club"
        ],
        "music": [
          "jazz",
          "latin"
        ],
        "desc": "Small club for funk, soul and latin grooves. Friendly crowd, lots of dancing.",
        "style": [
          "casual"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "casual"
      },
      {
        "name": "Sidecar",
        "lat": 41.3801,
        "lng": 2.17526,
        "area": "gothic-born",
        "vibe": [
          "live",
          "club"
        ],
        "music": [
          "indie"
        ],
        "desc": "Basement venue off Plaça Reial for indie and rock: gigs first, then DJs.",
        "style": [
          "alternative"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "casual"
      },
      {
        "name": "Sala Apolo",
        "lat": 41.37439,
        "lng": 2.16956,
        "area": "poble-sec",
        "vibe": [
          "live",
          "club"
        ],
        "music": [
          "indie",
          "electronic"
        ],
        "desc": "Historic ballroom on the Paral·lel with concerts and different themed club nights through the week.",
        "style": [
          "alternative",
          "casual"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "casual"
      },
      {
        "name": "Razzmatazz",
        "lat": 41.39759,
        "lng": 2.19125,
        "area": "poblenou",
        "vibe": [
          "live",
          "club"
        ],
        "music": [
          "indie",
          "electronic"
        ],
        "desc": "Huge warehouse club with several rooms, from indie to techno, and big-name concerts.",
        "style": [
          "alternative"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "casual"
      },
      {
        "name": "Moog",
        "lat": 41.37807,
        "lng": 2.17508,
        "area": "raval",
        "vibe": [
          "club"
        ],
        "music": [
          "electronic"
        ],
        "desc": "Small, sweaty techno club in the Raval, open late.",
        "style": [
          "alternative"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "casual"
      },
      {
        "name": "Sutton",
        "lat": 41.39595,
        "lng": 2.15174,
        "area": "sant-gervasi",
        "vibe": [
          "club"
        ],
        "music": [
          "commercial"
        ],
        "style": [
          "upscale"
        ],
        "crowd": [
          "locals"
        ],
        "dress": "smart",
        "desc": "Club on Carrer de Tuset, the heart of the uptown night out, with a smart, mostly local crowd. Busiest on Thursday to Saturday nights."
      },
      {
        "name": "Bling Bling",
        "lat": 41.39554,
        "lng": 2.15279,
        "area": "sant-gervasi",
        "vibe": [
          "club"
        ],
        "music": [
          "commercial"
        ],
        "style": [
          "upscale"
        ],
        "crowd": [
          "locals"
        ],
        "dress": "smart",
        "desc": "Club at the start of Carrer de Tuset (no. 8–10), one of the busiest spots of the uptown night out, with commercial music and a dressed-up, mostly local crowd."
      },
      {
        "name": "Gatsby",
        "lat": 41.39621,
        "lng": 2.15137,
        "area": "sant-gervasi",
        "vibe": [
          "cocktail",
          "club"
        ],
        "music": [
          "commercial"
        ],
        "style": [
          "upscale"
        ],
        "crowd": [
          "locals"
        ],
        "dress": "smart",
        "desc": "Roaring-twenties style venue on Carrer de Tuset: dinner and shows first, then drinks and music late into the night."
      },
      {
        "name": "Otto Zutz",
        "lat": 41.40011,
        "lng": 2.15038,
        "area": "sant-gervasi",
        "vibe": [
          "club"
        ],
        "music": [
          "commercial",
          "electronic"
        ],
        "style": [
          "upscale",
          "casual"
        ],
        "crowd": [
          "locals"
        ],
        "dress": "smartcasual",
        "desc": "A Barcelona classic since the 1980s, in an old textile building with three floors of music, near Via Augusta."
      },
      {
        "name": "Luz de Gas",
        "lat": 41.3946,
        "lng": 2.14904,
        "area": "sant-gervasi",
        "vibe": [
          "live",
          "club"
        ],
        "music": [
          "latin",
          "indie"
        ],
        "style": [
          "casual"
        ],
        "crowd": [
          "locals"
        ],
        "dress": "smartcasual",
        "desc": "Old music hall on Carrer de Muntaner with live bands and tribute concerts, then a club night with hits everyone knows."
      },
      {
        "name": "Slow",
        "lat": 41.39354,
        "lng": 2.15337,
        "area": "sant-gervasi",
        "vibe": [
          "cocktail",
          "club"
        ],
        "music": [
          "commercial"
        ],
        "style": [
          "upscale"
        ],
        "crowd": [
          "locals"
        ],
        "dress": "smart",
        "desc": "Stylish bar-club near the Diagonal, popular with a well-dressed local crowd."
      },
      {
        "name": "Solange",
        "lat": 41.39224,
        "lng": 2.154,
        "area": "eixample",
        "vibe": [
          "cocktail"
        ],
        "music": [],
        "style": [
          "upscale"
        ],
        "crowd": [
          "locals"
        ],
        "dress": "smartcasual",
        "desc": "Cocktail bar on Carrer d'Aribau inspired by the women of the James Bond films, with elegant, classic drinks."
      },
      {
        "name": "Mirablau",
        "lat": 41.41604,
        "lng": 2.13192,
        "area": "sant-gervasi",
        "vibe": [
          "cocktail",
          "club"
        ],
        "music": [
          "commercial"
        ],
        "style": [
          "upscale"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "smartcasual",
        "desc": "Bar at the foot of Tibidabo with huge windows over the whole city; drinks with a view, then dancing late at night."
      },
      {
        "name": "Bikini",
        "lat": 41.38946,
        "lng": 2.13703,
        "area": "sant-gervasi",
        "vibe": [
          "club",
          "live"
        ],
        "music": [
          "latin",
          "indie"
        ],
        "style": [
          "casual"
        ],
        "crowd": [
          "locals"
        ],
        "dress": "casual",
        "desc": "A Barcelona institution on the Diagonal: concerts and a club with different rooms and styles."
      },
      {
        "name": "Quilombo",
        "lat": 41.39251,
        "lng": 2.15366,
        "area": "eixample",
        "vibe": [
          "live"
        ],
        "music": [
          "latin"
        ],
        "style": [
          "casual",
          "alternative"
        ],
        "crowd": [
          "locals"
        ],
        "dress": "casual",
        "desc": "A small, long-running bar on Carrer d'Aribau with guitars and Latin American songs that everyone ends up singing."
      },
      {
        "name": "Antilla BCN",
        "lat": 41.38457,
        "lng": 2.1546,
        "area": "eixample",
        "vibe": [
          "club"
        ],
        "music": [
          "latin"
        ],
        "style": [
          "casual"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "casual",
        "desc": "The city's best-known salsa club, with dance classes early in the evening. Beginners are welcome."
      },
      {
        "name": "Dow Jones",
        "lat": 41.3955,
        "lng": 2.16774,
        "area": "eixample",
        "vibe": [
          "cocktail"
        ],
        "music": [],
        "style": [
          "casual"
        ],
        "crowd": [
          "locals"
        ],
        "dress": "casual",
        "desc": "Bar where drink prices go up and down like a stock market on screens. Popular with students."
      },
      {
        "name": "City Hall",
        "lat": 41.38775,
        "lng": 2.16826,
        "area": "eixample",
        "vibe": [
          "club"
        ],
        "music": [
          "commercial",
          "electronic",
          "indie"
        ],
        "style": [
          "casual"
        ],
        "crowd": [
          "mixed"
        ],
        "dress": "casual",
        "desc": "Club in an old theatre at the top of the Rambla de Catalunya, with a terrace and different music each night."
      }
    ]
  },
  "museums": {
    "label": "Museums & culture",
    "img": "(Barcelona) Saló Oval (Museu Nacional d'Art de Catalunya) - Southwest part of the room.jpg",
    "intro": "From Romanesque murals to design and science: museums worth a few hours, many of them in beautiful buildings.",
    "filters": [
      {
        "id": "kind",
        "label": "What kind?",
        "options": [
          {
            "id": "art",
            "label": "Art"
          },
          {
            "id": "history",
            "label": "History"
          },
          {
            "id": "science",
            "label": "Science"
          },
          {
            "id": "design",
            "label": "Design"
          }
        ]
      },
      {
        "id": "area",
        "label": "Where?",
        "options": [
          {
            "id": "old-town",
            "label": "Old town (Gothic, Born, Raval)"
          },
          {
            "id": "eixample",
            "label": "Eixample"
          },
          {
            "id": "montjuic",
            "label": "Montjuïc"
          },
          {
            "id": "seafront",
            "label": "Seafront & Poblenou"
          },
          {
            "id": "uptown",
            "label": "Hills & uptown"
          }
        ]
      }
    ],
    "places": [
      {
        "name": "MNAC",
        "lat": 41.3686,
        "lng": 2.15346,
        "area": "montjuic",
        "kind": [
          "art",
          "history"
        ],
        "desc": "Catalonia's national art museum, in the grand Palau Nacional built for the 1929 International Exhibition. Famous for its Romanesque church murals."
      },
      {
        "name": "Fundació Joan Miró",
        "lat": 41.36864,
        "lng": 2.16008,
        "area": "montjuic",
        "kind": [
          "art"
        ],
        "desc": "Bright, white museum designed by Josep Lluís Sert for his friend Joan Miró, with paintings, sculptures and a rooftop terrace."
      },
      {
        "name": "CaixaForum",
        "lat": 41.37148,
        "lng": 2.14972,
        "area": "montjuic",
        "kind": [
          "art",
          "design"
        ],
        "desc": "Exhibitions inside a former Modernista textile factory by Josep Puig i Cadafalch."
      },
      {
        "name": "Museu Frederic Marès",
        "lat": 41.38436,
        "lng": 2.17673,
        "area": "old-town",
        "kind": [
          "art",
          "history"
        ],
        "desc": "A sculptor's huge personal collection, from medieval carvings to everyday objects, in a palace next to the Cathedral."
      },
      {
        "name": "Museu d'Història de Catalunya",
        "lat": 41.38082,
        "lng": 2.18587,
        "area": "seafront",
        "kind": [
          "history"
        ],
        "desc": "Catalonia's history told in an old port warehouse, the Palau de Mar, with a terrace looking over the harbour."
      },
      {
        "name": "Museu Egipci",
        "lat": 41.39362,
        "lng": 2.16474,
        "area": "eixample",
        "kind": [
          "history"
        ],
        "desc": "A private museum of ancient Egyptian objects, just off Passeig de Gràcia."
      },
      {
        "name": "Museu del Disseny",
        "lat": 41.4026,
        "lng": 2.18805,
        "area": "seafront",
        "kind": [
          "design"
        ],
        "desc": "Design, fashion and decorative arts in a striking building at Glòries that locals nicknamed \"the stapler\"."
      },
      {
        "name": "CosmoCaixa",
        "lat": 41.41245,
        "lng": 2.13167,
        "area": "uptown",
        "kind": [
          "science"
        ],
        "desc": "Large hands-on science museum, best known for its recreated flooded forest from the Amazon."
      }
    ]
  },
  "viewpoints": {
    "label": "Viewpoints",
    "img": "View from the Bunkers del Carmel.jpg",
    "intro": "See the whole city from above. Remember that several viewpoints sit next to people's homes: keep it quiet, especially at sunset.",
    "filters": [
      {
        "id": "view",
        "label": "What view?",
        "options": [
          {
            "id": "city",
            "label": "City"
          },
          {
            "id": "sea",
            "label": "Sea"
          }
        ]
      },
      {
        "id": "area",
        "label": "Where?",
        "options": [
          {
            "id": "old-town",
            "label": "Old town (Gothic, Born, Raval)"
          },
          {
            "id": "eixample",
            "label": "Eixample"
          },
          {
            "id": "montjuic",
            "label": "Montjuïc"
          },
          {
            "id": "uptown",
            "label": "Hills & uptown"
          }
        ]
      }
    ],
    "places": [
      {
        "name": "Bunkers del Carmel",
        "lat": 41.41939,
        "lng": 2.1617,
        "area": "uptown",
        "view": [
          "city",
          "sea"
        ],
        "desc": "A 360° view from an old Civil War anti-aircraft battery. Very popular at sunset; neighbours have asked visitors to keep the noise down."
      },
      {
        "name": "Mirador del Palau Nacional",
        "lat": 41.36902,
        "lng": 2.15319,
        "area": "montjuic",
        "view": [
          "city"
        ],
        "desc": "The terrace in front of the MNAC looks straight down the avenue to Plaça d'Espanya and across the city."
      },
      {
        "name": "Castell de Montjuïc",
        "lat": 41.36338,
        "lng": 2.16614,
        "area": "montjuic",
        "view": [
          "city",
          "sea"
        ],
        "desc": "A 17th-century fortress on top of Montjuïc, with views over the port on one side and the city on the other."
      },
      {
        "name": "Arenas de Barcelona",
        "lat": 41.3763,
        "lng": 2.1493,
        "area": "eixample",
        "view": [
          "city"
        ],
        "desc": "A former bullring turned into a shopping centre, with a round rooftop walkway overlooking Plaça d'Espanya and Montjuïc."
      },
      {
        "name": "Parc del Guinardó",
        "lat": 41.42049,
        "lng": 2.16691,
        "area": "uptown",
        "view": [
          "city"
        ],
        "desc": "A quiet hillside park with wide views, mostly visited by locals."
      },
      {
        "name": "Turó del Putxet",
        "lat": 41.40885,
        "lng": 2.14185,
        "area": "uptown",
        "view": [
          "city"
        ],
        "desc": "A small hilltop park in a residential area, with a peaceful view over the city to the sea."
      },
      {
        "name": "Mirador de Colom",
        "lat": 41.3758,
        "lng": 2.17777,
        "area": "old-town",
        "view": [
          "sea",
          "city"
        ],
        "desc": "A lift inside the Columbus column at the end of the Rambla takes you up to a small viewing platform over the port."
      },
      {
        "name": "Tibidabo",
        "lat": 41.42315,
        "lng": 2.11994,
        "area": "uptown",
        "view": [
          "city",
          "sea"
        ],
        "desc": "The highest point over Barcelona, crowned by the Sagrat Cor church. The best panorama in the city on a clear day."
      }
    ]
  },
  "cafes": {
    "label": "Cafés & granjas",
    "img": "Chocolate con churros en Barcelona.jpg",
    "intro": "Classic granjas for hot chocolate, historic pastry shops and neighbourhood cafés, all local businesses rather than chains.",
    "filters": [
      {
        "id": "kind",
        "label": "What for?",
        "options": [
          {
            "id": "chocolate",
            "label": "Chocolate & churros"
          },
          {
            "id": "pastries",
            "label": "Pastries & bakeries"
          },
          {
            "id": "historic",
            "label": "Historic café"
          },
          {
            "id": "coffee",
            "label": "Good coffee"
          },
          {
            "id": "local",
            "label": "Neighbourhood café"
          }
        ]
      },
      {
        "id": "area",
        "label": "Where?",
        "options": [
          {
            "id": "old-town",
            "label": "Old town (Gothic, Born, Raval)"
          },
          {
            "id": "eixample",
            "label": "Eixample"
          },
          {
            "id": "gracia",
            "label": "Gràcia"
          },
          {
            "id": "seafront",
            "label": "Barceloneta"
          }
        ]
      }
    ],
    "places": [
      {
        "name": "Granja Dulcinea",
        "lat": 41.38247,
        "lng": 2.17341,
        "area": "old-town",
        "kind": [
          "chocolate",
          "historic"
        ],
        "desc": "A family-run granja on Carrer de Petritxol since 1941, famous for thick hot chocolate with churros or melindros."
      },
      {
        "name": "Granja La Pallaresa",
        "lat": 41.3829,
        "lng": 2.1728,
        "area": "old-town",
        "kind": [
          "chocolate",
          "historic"
        ],
        "desc": "Another classic on Petritxol, the little street known for its chocolate shops. Expect a queue on winter afternoons."
      },
      {
        "name": "Cafè de l'Òpera",
        "lat": 41.38097,
        "lng": 2.17378,
        "area": "old-town",
        "kind": [
          "historic"
        ],
        "desc": "A café on the Rambla since 1929, opposite the Liceu opera house, with its original Modernista-style interior."
      },
      {
        "name": "Nømad Coffee",
        "lat": 41.38891,
        "lng": 2.17717,
        "area": "old-town",
        "kind": [
          "coffee"
        ],
        "desc": "One of the pioneers of specialty coffee in Barcelona, in a small passage in Sant Pere."
      },
      {
        "name": "Granja M. Viader",
        "lat": 41.38296,
        "lng": 2.171,
        "area": "old-town",
        "kind": [
          "chocolate",
          "historic"
        ],
        "desc": "A granja in the Raval since 1870, where Cacaolat, Barcelona's famous chocolate milk, was born. Try the hot chocolate with cream."
      },
      {
        "name": "Pastisseria La Colmena",
        "lat": 41.38379,
        "lng": 2.17823,
        "area": "old-town",
        "kind": [
          "pastries",
          "historic"
        ],
        "desc": "One of the oldest pastry shops in the city, on Plaça de l'Àngel, known for its traditional sweets and honey-coloured caramels."
      },
      {
        "name": "Escribà",
        "lat": 41.38304,
        "lng": 2.16025,
        "area": "eixample",
        "kind": [
          "pastries"
        ],
        "desc": "The flagship shop of the Escribà family of pastry makers on Gran Via, famous for their cakes and chocolate creations."
      },
      {
        "name": "Cafès El Magnífico",
        "lat": 41.38352,
        "lng": 2.18101,
        "area": "old-town",
        "kind": [
          "coffee",
          "historic"
        ],
        "desc": "Family coffee roasters in the Born since 1919. Come for an excellent coffee and to smell the beans being roasted."
      },
      {
        "name": "Bar Velódromo",
        "lat": 41.39347,
        "lng": 2.15016,
        "area": "eixample",
        "kind": [
          "historic",
          "local"
        ],
        "desc": "A grand café-bar from 1933 on Carrer de Muntaner, with high ceilings and a long bar, open from breakfast to late."
      },
      {
        "name": "Granja La Nena",
        "lat": 41.40266,
        "lng": 2.15887,
        "area": "gracia",
        "kind": [
          "chocolate",
          "local"
        ],
        "desc": "Gràcia's family granja for thick hot chocolate, crêpes and homemade cakes, much loved by local families."
      },
      {
        "name": "Forn Baluard",
        "lat": 41.38002,
        "lng": 2.18886,
        "area": "seafront",
        "kind": [
          "pastries",
          "local"
        ],
        "desc": "Excellent neighbourhood bakery in Barceloneta, known for its sourdough bread and pastries baked in a wood-fired oven."
      },
      {
        "name": "Cafè Salambó",
        "lat": 41.40445,
        "lng": 2.15764,
        "area": "gracia",
        "kind": [
          "local"
        ],
        "desc": "A spacious Gràcia café and meeting point, next to the Verdi cinemas, popular before or after a film."
      }
    ]
  },
  "family": {
    "label": "With kids",
    "img": "Mont Juic Teleferic.jpg",
    "intro": "Animals, science, cable cars and rides: plans that work for children (and their parents).",
    "filters": [
      {
        "id": "kind",
        "label": "What do they like?",
        "options": [
          {
            "id": "animals",
            "label": "Animals"
          },
          {
            "id": "science",
            "label": "Science"
          },
          {
            "id": "rides",
            "label": "Rides & cable cars"
          },
          {
            "id": "treats",
            "label": "Sweet treats"
          }
        ]
      },
      {
        "id": "area",
        "label": "Where?",
        "options": [
          {
            "id": "old-town",
            "label": "Old town (Gothic, Born, Raval)"
          },
          {
            "id": "montjuic",
            "label": "Montjuïc"
          },
          {
            "id": "seafront",
            "label": "Seafront & Poblenou"
          },
          {
            "id": "uptown",
            "label": "Hills & uptown"
          }
        ]
      }
    ],
    "places": [
      {
        "name": "Aquàrium de Barcelona",
        "lat": 41.37685,
        "lng": 2.18441,
        "area": "seafront",
        "kind": [
          "animals"
        ],
        "desc": "Large aquarium in Port Vell, with an underwater tunnel where sharks swim overhead."
      },
      {
        "name": "Zoo de Barcelona",
        "lat": 41.38612,
        "lng": 2.18725,
        "area": "old-town",
        "kind": [
          "animals"
        ],
        "desc": "The city zoo, inside Parc de la Ciutadella."
      },
      {
        "name": "CosmoCaixa",
        "lat": 41.41245,
        "lng": 2.13167,
        "area": "uptown",
        "kind": [
          "science"
        ],
        "desc": "Hands-on science museum with a recreated Amazon flooded forest, great for curious kids."
      },
      {
        "name": "Museu de la Xocolata",
        "lat": 41.38711,
        "lng": 2.18172,
        "area": "old-town",
        "kind": [
          "treats"
        ],
        "desc": "The chocolate museum in the Born, run by the city's pastry makers, with sculptures made of chocolate."
      },
      {
        "name": "Telefèric de Montjuïc",
        "lat": 41.36765,
        "lng": 2.16723,
        "area": "montjuic",
        "kind": [
          "rides"
        ],
        "desc": "A cable car up to Montjuïc castle, with views over the port and the city."
      },
      {
        "name": "Poble Espanyol",
        "lat": 41.36955,
        "lng": 2.14676,
        "area": "montjuic",
        "kind": [
          "rides"
        ],
        "desc": "An open-air village built for the 1929 International Exhibition, with copies of buildings from all over Spain and craft workshops."
      },
      {
        "name": "Parc d'Atraccions Tibidabo",
        "lat": 41.42315,
        "lng": 2.11994,
        "area": "uptown",
        "kind": [
          "rides"
        ],
        "desc": "One of the oldest amusement parks in Europe, opened in 1901 on top of Tibidabo, with views over the whole city."
      }
    ]
  },
  "shops": {
    "label": "Local shops",
    "img": "060 Casa Gispert, c. Sombrerers 23 (Barcelona).jpg",
    "intro": "Family and independent shops, some open for generations, others new. Buying something helps them stay open.",
    "filters": [
      {
        "id": "kind",
        "label": "What are you after?",
        "options": [
          {
            "id": "crafts",
            "label": "Crafts & gifts"
          },
          {
            "id": "food",
            "label": "Food & wine"
          },
          {
            "id": "fashion",
            "label": "Hats & fashion"
          },
          {
            "id": "books",
            "label": "Books & music"
          },
          {
            "id": "market",
            "label": "Flea market"
          }
        ]
      },
      {
        "id": "type",
        "label": "What kind of shop?",
        "options": [
          {
            "id": "historic",
            "label": "Historic (open for generations)"
          },
          {
            "id": "independent",
            "label": "Independent, more recent"
          }
        ]
      },
      {
        "id": "area",
        "label": "Where?",
        "options": [
          {
            "id": "old-town",
            "label": "Old town (Gothic, Born, Raval)"
          },
          {
            "id": "seafront",
            "label": "Seafront & Poblenou"
          },
          {
            "id": "eixample",
            "label": "Eixample"
          }
        ]
      }
    ],
    "places": [
      {
        "name": "Cereria Subirà",
        "lat": 41.38382,
        "lng": 2.17804,
        "area": "old-town",
        "kind": [
          "crafts"
        ],
        "desc": "A candle shop open since 1761, often called the oldest shop in Barcelona, with a beautiful 19th-century interior.",
        "type": [
          "historic"
        ]
      },
      {
        "name": "La Manual Alpargatera",
        "lat": 41.38155,
        "lng": 2.17612,
        "area": "old-town",
        "kind": [
          "crafts"
        ],
        "desc": "Handmade espadrilles since the 1940s, still made in the traditional way.",
        "type": [
          "historic"
        ]
      },
      {
        "name": "Casa Gispert",
        "lat": 41.38409,
        "lng": 2.18192,
        "area": "old-town",
        "kind": [
          "food"
        ],
        "desc": "Nuts, dried fruit and coffee roasted in a wood-fired oven since 1851, in the Born.",
        "type": [
          "historic"
        ]
      },
      {
        "name": "El Rei de la Màgia",
        "lat": 41.38463,
        "lng": 2.17943,
        "area": "old-town",
        "kind": [
          "crafts"
        ],
        "desc": "A magic shop open since 1881, full of tricks, posters and history.",
        "type": [
          "historic"
        ]
      },
      {
        "name": "Vila Viniteca",
        "lat": 41.38247,
        "lng": 2.18155,
        "area": "old-town",
        "kind": [
          "food"
        ],
        "desc": "A family wine shop in the Born with a huge selection of Catalan and Spanish wines, and a deli next door.",
        "type": [
          "historic"
        ]
      },
      {
        "name": "Els Encants",
        "lat": 41.40101,
        "lng": 2.18809,
        "area": "seafront",
        "kind": [
          "market"
        ],
        "desc": "One of the oldest flea markets in Europe, now under a huge mirrored roof at Glòries. Open a few days a week.",
        "type": [
          "historic"
        ]
      },
      {
        "name": "Herboristeria del Rei",
        "lat": 41.38065,
        "lng": 2.17505,
        "area": "old-town",
        "kind": [
          "crafts"
        ],
        "desc": "A herbalist's shop open since 1823, just off Plaça Reial, with its original carved wooden interior full of drawers and jars.",
        "type": [
          "historic"
        ]
      },
      {
        "name": "Ganiveteria Roca",
        "lat": 41.38248,
        "lng": 2.1735,
        "area": "old-town",
        "kind": [
          "crafts"
        ],
        "desc": "A knife and cutlery shop on Plaça del Pi since 1911, with a beautiful Modernista façade.",
        "type": [
          "historic"
        ]
      },
      {
        "name": "Sombrereria Mil",
        "lat": 41.38824,
        "lng": 2.17273,
        "area": "old-town",
        "kind": [
          "fashion"
        ],
        "desc": "A traditional hat shop near Plaça Urquinaona, with berets, fedoras and Panama hats.",
        "type": [
          "historic"
        ]
      },
      {
        "name": "Casa Beethoven",
        "lat": 41.38231,
        "lng": 2.17183,
        "area": "old-town",
        "kind": [
          "books"
        ],
        "desc": "A sheet-music shop on the Rambla since 1880, still selling scores to musicians from all over the city.",
        "type": [
          "historic"
        ]
      },
      {
        "name": "Planelles Donat",
        "lat": 41.38624,
        "lng": 2.172,
        "area": "old-town",
        "kind": [
          "food"
        ],
        "desc": "Turrón makers since 1850 on Portal de l'Àngel; in summer they also serve horchata and ice cream.",
        "type": [
          "historic"
        ]
      },
      {
        "name": "Colmado Quílez",
        "lat": 41.39121,
        "lng": 2.16298,
        "area": "eixample",
        "kind": [
          "food"
        ],
        "desc": "A grocery on Rambla de Catalunya since 1908, with shelves to the ceiling full of wines, preserves and delicatessen.",
        "type": [
          "historic"
        ]
      },
      {
        "name": "Llibreria Altaïr",
        "lat": 41.38773,
        "lng": 2.16644,
        "area": "eixample",
        "kind": [
          "books"
        ],
        "desc": "A large independent bookshop dedicated entirely to travel, maps and guidebooks.",
        "type": [
          "independent"
        ]
      },
      {
        "name": "Llibreria Calders",
        "lat": 41.3767,
        "lng": 2.1622,
        "area": "eixample",
        "kind": [
          "books"
        ],
        "type": [
          "independent"
        ],
        "why": "Independent bookshop with a strong Catalan-language selection and a cultural programme for its neighbourhood.",
        "sources": [
          {
            "url": "https://www.timeout.com/barcelona/shopping/llibreria-calders",
            "checked": "2026-11-14"
          },
          {
            "url": "https://ajuntament.barcelona.cat/dones/en/Guide/99400367648",
            "checked": "2026-11-14"
          }
        ],
        "desc": "Independent bookshop in a former button factory, in a small passage of Sant Antoni named after the writer Pere Calders. Many books in Catalan and a busy programme of talks."
      },
      {
        "name": "Queviures Múrria",
        "lat": 41.3948,
        "lng": 2.1665,
        "area": "eixample",
        "kind": [
          "food"
        ],
        "type": [
          "historic"
        ],
        "why": "Family grocery with its original Modernista shopfront, run by the Múrria family since 1943.",
        "sources": [
          {
            "url": "https://www.barcelonaturisme.com/wv3/en/enjoy/213/six-colmados-where-you-can-purchase-and-taste-gourmet-produce-in-barcelona-.html",
            "checked": "2026-11-14"
          },
          {
            "url": "https://barcelona.cat/en/conocebcn/pics/queviures-murria-75990074268",
            "checked": "2026-11-14"
          }
        ],
        "desc": "A grocery from the end of the 19th century on Carrer de Roger de Llúria, with its original Modernista shopfront and painted-glass adverts. The Múrria family has run it since 1943."
      },
      {
        "name": "Torrons La Campana",
        "lat": 41.3859,
        "lng": 2.1813,
        "area": "old-town",
        "kind": [
          "food"
        ],
        "type": [
          "historic"
        ],
        "why": "Family turrón makers since 1890, the same family for four generations; on Carrer de la Princesa since 1920.",
        "sources": [
          {
            "url": "https://www.timeout.es/barcelona/es/noticias/la-campana-de-barcelona-130-anos-de-horchata-y-turrones-en-el-born-071825",
            "checked": "2026-11-14"
          },
          {
            "url": "https://es.ara.cat/comer/campana-matriarcado-calle-princesa-endulza-navidad-siglo_1_5234829.html",
            "checked": "2026-11-14"
          }
        ],
        "desc": "Turrón makers since 1890, run by the same family for four generations, at Carrer de la Princesa, 36 since 1920. In summer, horchata and ice cream."
      }
    ]
  },
  "sports": {
    "label": "Sports",
    "img": "Montjuic2.jpg",
    "intro": "Stadiums, Olympic venues and neighbourhood clubs. Most are outside the old town, so take the metro or a bus.",
    "filters": [
      {
        "id": "kind",
        "label": "What kind?",
        "options": [
          {
            "id": "football",
            "label": "Football"
          },
          {
            "id": "olympic",
            "label": "1992 Olympics"
          },
          {
            "id": "museum",
            "label": "Museums & tours"
          },
          {
            "id": "active",
            "label": "Do sport yourself"
          }
        ]
      },
      {
        "id": "area",
        "label": "Where?",
        "options": [
          {
            "id": "montjuic",
            "label": "Montjuïc"
          },
          {
            "id": "les-corts",
            "label": "Les Corts"
          },
          {
            "id": "gracia",
            "label": "Gràcia"
          },
          {
            "id": "north",
            "label": "Sant Andreu & Horta"
          }
        ]
      }
    ],
    "places": [
      {
        "name": "Spotify Camp Nou",
        "lat": 41.38088,
        "lng": 2.12282,
        "area": "les-corts",
        "kind": [
          "football",
          "museum"
        ],
        "desc": "FC Barcelona's stadium, the largest in Europe. It has been under major renovation, so check the match calendar and the museum and stadium-tour status before you go. Metro: Palau Reial or Les Corts (L3)."
      },
      {
        "name": "Estadi Olímpic Lluís Companys",
        "lat": 41.36472,
        "lng": 2.15565,
        "area": "montjuic",
        "kind": [
          "olympic",
          "football"
        ],
        "desc": "Built in 1929 and renovated for the 1992 Olympic Games, which opened here. Reach Montjuïc by the funicular from Paral·lel (L2, L3)."
      },
      {
        "name": "Museu Olímpic i de l'Esport",
        "lat": 41.36589,
        "lng": 2.15763,
        "area": "montjuic",
        "kind": [
          "olympic",
          "museum"
        ],
        "desc": "Interactive sports museum next to the Olympic Stadium, with memories of the 1992 Games."
      },
      {
        "name": "Palau Sant Jordi",
        "lat": 41.36347,
        "lng": 2.15257,
        "area": "montjuic",
        "kind": [
          "olympic"
        ],
        "desc": "The indoor arena of the 1992 Olympics, designed by Arata Isozaki. Today it hosts big concerts and sports events."
      },
      {
        "name": "Piscines Bernat Picornell",
        "lat": 41.36582,
        "lng": 2.15072,
        "area": "montjuic",
        "kind": [
          "olympic",
          "active"
        ],
        "desc": "The Olympic swimming pools of 1992, now a public sports centre: in summer you can swim outdoors with views over the city."
      },
      {
        "name": "Nou Sardenya",
        "lat": 41.41177,
        "lng": 2.16154,
        "area": "gracia",
        "kind": [
          "football"
        ],
        "desc": "Home of CE Europa, Gràcia's historic club, founded in 1907. A home match is a great way to see local football up close."
      },
      {
        "name": "Camp Municipal Narcís Sala",
        "lat": 41.42881,
        "lng": 2.19304,
        "area": "north",
        "kind": [
          "football"
        ],
        "desc": "Home of UE Sant Andreu, a neighbourhood club with a long history and loyal local fans, in the north of the city."
      },
      {
        "name": "Velòdrom d'Horta",
        "lat": 41.43808,
        "lng": 2.14885,
        "area": "north",
        "kind": [
          "active"
        ],
        "desc": "Open-air cycling track built for the 1984 World Track Cycling Championships, next to the Laberint d'Horta gardens. Metro: Mundet (L3)."
      }
    ]
  }
};
