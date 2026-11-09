// Activities: hand-picked places, shown by category and filters.
// No live availability and no booking inside WalkBCN (MVP): "See & book" opens
// the place on Google Maps, where its own website / booking options are listed.
// Every place was checked on OpenStreetMap, which confirms it is registered there,
// not that it is still open: check before showing this to users.
// Local businesses only: no chains and no places aimed mainly at expats.
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
            "label": "Catalan classics"
          },
          {
            "id": "tapas",
            "label": "Tapas"
          },
          {
            "id": "seafood",
            "label": "Seafood & rice"
          },
          {
            "id": "veggie",
            "label": "Vegetarian-friendly"
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
        "area": "gothic-born",
        "price": "2",
        "food": [
          "catalan"
        ],
        "desc": "Open since 1786 and often called the oldest restaurant in Barcelona. Traditional Catalan dishes in tiled, old-fashioned dining rooms."
      },
      {
        "name": "Els Quatre Gats",
        "area": "gothic-born",
        "price": "3",
        "food": [
          "catalan"
        ],
        "desc": "The Modernista café where a young Picasso held his first exhibition in 1900. Catalan cooking in one of the city's most beautiful rooms."
      },
      {
        "name": "El Xampanyet",
        "area": "gothic-born",
        "price": "1",
        "food": [
          "tapas"
        ],
        "desc": "Tiny, always-busy bar on Carrer de Montcada, by the Picasso Museum. Come for the house cava and simple tapas, and expect to stand."
      },
      {
        "name": "Cal Pep",
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
        "area": "gothic-born",
        "price": "2",
        "food": [
          "tapas"
        ],
        "desc": "Relaxed Born bar mixing classic and creative tapas, with a good wine list. A favourite with locals."
      },
      {
        "name": "Bar Cañete",
        "area": "raval",
        "price": "3",
        "food": [
          "tapas",
          "seafood"
        ],
        "desc": "Lively, polished counter bar near the Liceu opera house, serving classic tapas done very well."
      },
      {
        "name": "Teresa Carles",
        "area": "raval",
        "price": "2",
        "food": [
          "veggie"
        ],
        "desc": "Long-running vegetarian restaurant near Plaça de Catalunya with creative, plant-based Mediterranean dishes."
      },
      {
        "name": "Flax & Kale",
        "area": "raval",
        "price": "2",
        "food": [
          "veggie"
        ],
        "desc": "Bright, health-focused restaurant from the Teresa Carles family. Mostly plant-based, with a few fish dishes."
      },
      {
        "name": "Quimet & Quimet",
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
        "area": "eixample",
        "price": "2",
        "food": [
          "tapas"
        ],
        "desc": "Big, buzzing tapas bar loved by locals and visitors alike. Go early or expect a wait."
      },
      {
        "name": "La Pubilla",
        "area": "gracia",
        "price": "2",
        "food": [
          "catalan"
        ],
        "desc": "Next to the Mercat de la Llibertat. Hearty Catalan market cooking, best known for its traditional \"fork breakfasts\"."
      },
      {
        "name": "La Pepita",
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
        "area": "barceloneta",
        "price": "3",
        "food": [
          "seafood"
        ],
        "desc": "A Barceloneta classic for over a century, known for seafood, rice dishes and paella."
      },
      {
        "name": "Can Paixano",
        "area": "barceloneta",
        "price": "1",
        "food": [
          "tapas"
        ],
        "desc": "Packed standing bar serving cheap house cava and grilled sandwiches. Loud, crowded and great fun."
      },
      {
        "name": "La Venta",
        "area": "sant-gervasi",
        "price": "3",
        "food": [
          "catalan"
        ],
        "desc": "Classic restaurant at the foot of Tibidabo, with a glassed-in terrace and views over the whole city. A special-occasion favourite of locals."
      },
      {
        "name": "Via Veneto",
        "area": "sant-gervasi",
        "price": "3",
        "food": [
          "catalan"
        ],
        "desc": "Elegant, old-school fine dining in Sant Gervasi, serving refined Catalan cooking since the 1960s."
      },
      {
        "name": "Botafumeiro",
        "area": "gracia",
        "price": "3",
        "food": [
          "seafood"
        ],
        "desc": "Long-established Galician seafood restaurant on Carrer Gran de Gràcia, with white-jacketed waiters and a famous seafood bar."
      },
      {
        "name": "7 Portes",
        "area": "gothic-born",
        "price": "3",
        "food": [
          "seafood",
          "catalan"
        ],
        "desc": "Opened in 1836 and famous for its rice dishes and paella, served in grand, old-fashioned dining rooms."
      },
      {
        "name": "Can Majó",
        "area": "barceloneta",
        "price": "3",
        "food": [
          "seafood"
        ],
        "desc": "Seafood and rice dishes by the beach in Barceloneta, run by the same family for decades."
      },
      {
        "name": "Casa Delfín",
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
        "area": "eixample",
        "price": "2",
        "food": [
          "tapas"
        ],
        "desc": "Busy, no-frills bodega in Sant Antoni with a long list of traditional and creative tapas."
      },
      {
        "name": "El Glop",
        "area": "gracia",
        "price": "2",
        "food": [
          "catalan"
        ],
        "desc": "Rustic Catalan tavern in Gràcia, known for grilled meats and calçots in season."
      },
      {
        "name": "Bar La Plata",
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
        "area": "barceloneta",
        "price": "1",
        "food": [
          "tapas"
        ],
        "desc": "No-nonsense Barceloneta bar famous for its bombas and patatas bravas."
      },
      {
        "name": "Bodega Quimet",
        "area": "gracia",
        "price": "1",
        "food": [
          "tapas"
        ],
        "desc": "Old bodega in Gràcia with barrels, vermouth on tap and simple tapas."
      },
      {
        "name": "Bar Tomàs",
        "area": "sant-gervasi",
        "price": "1",
        "food": [
          "tapas"
        ],
        "desc": "Neighbourhood bar in Sarrià whose patatas bravas many locals call the best in the city."
      },
      {
        "name": "Bodega l'Electricitat",
        "area": "barceloneta",
        "price": "1",
        "food": [
          "tapas"
        ],
        "desc": "Barceloneta bodega for a vermouth and a few simple tapas, the way neighbours do on weekends."
      }
    ]
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
        "area": "gothic-born",
        "vibe": [
          "live"
        ],
        "music": [
          "latin"
        ],
        "desc": "Short flamenco shows in a small room on Plaça Reial. An easy first taste of flamenco.",
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
        "area": "montjuic",
        "kind": [
          "art",
          "history"
        ],
        "desc": "Catalonia's national art museum, in the grand Palau Nacional built for the 1929 International Exhibition. Famous for its Romanesque church murals."
      },
      {
        "name": "Fundació Joan Miró",
        "area": "montjuic",
        "kind": [
          "art"
        ],
        "desc": "Bright, white museum designed by Josep Lluís Sert for his friend Joan Miró, with paintings, sculptures and a rooftop terrace."
      },
      {
        "name": "CaixaForum",
        "area": "montjuic",
        "kind": [
          "art",
          "design"
        ],
        "desc": "Exhibitions inside a former Modernista textile factory by Josep Puig i Cadafalch."
      },
      {
        "name": "Museu Frederic Marès",
        "area": "old-town",
        "kind": [
          "art",
          "history"
        ],
        "desc": "A sculptor's huge personal collection, from medieval carvings to everyday objects, in a palace next to the Cathedral."
      },
      {
        "name": "Museu d'Història de Catalunya",
        "area": "seafront",
        "kind": [
          "history"
        ],
        "desc": "Catalonia's history told in an old port warehouse, the Palau de Mar, with a terrace looking over the harbour."
      },
      {
        "name": "Museu Egipci",
        "area": "eixample",
        "kind": [
          "history"
        ],
        "desc": "A private museum of ancient Egyptian objects, just off Passeig de Gràcia."
      },
      {
        "name": "Museu del Disseny",
        "area": "seafront",
        "kind": [
          "design"
        ],
        "desc": "Design, fashion and decorative arts in a striking building at Glòries that locals nicknamed \"the stapler\"."
      },
      {
        "name": "CosmoCaixa",
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
        "area": "uptown",
        "view": [
          "city",
          "sea"
        ],
        "desc": "A 360° view from an old Civil War anti-aircraft battery. Very popular at sunset; neighbours have asked visitors to keep the noise down."
      },
      {
        "name": "Mirador del Palau Nacional",
        "area": "montjuic",
        "view": [
          "city"
        ],
        "desc": "The terrace in front of the MNAC looks straight down the avenue to Plaça d'Espanya and across the city."
      },
      {
        "name": "Castell de Montjuïc",
        "area": "montjuic",
        "view": [
          "city",
          "sea"
        ],
        "desc": "A 17th-century fortress on top of Montjuïc, with views over the port on one side and the city on the other."
      },
      {
        "name": "Arenas de Barcelona",
        "area": "eixample",
        "view": [
          "city"
        ],
        "desc": "A former bullring turned into a shopping centre, with a round rooftop walkway overlooking Plaça d'Espanya and Montjuïc."
      },
      {
        "name": "Parc del Guinardó",
        "area": "uptown",
        "view": [
          "city"
        ],
        "desc": "A quiet hillside park with wide views, mostly visited by locals."
      },
      {
        "name": "Turó del Putxet",
        "area": "uptown",
        "view": [
          "city"
        ],
        "desc": "A small hilltop park in a residential area, with a peaceful view over the city to the sea."
      },
      {
        "name": "Mirador de Colom",
        "area": "old-town",
        "view": [
          "sea",
          "city"
        ],
        "desc": "A lift inside the Columbus column at the end of the Rambla takes you up to a small viewing platform over the port."
      },
      {
        "name": "Tibidabo",
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
        "area": "old-town",
        "kind": [
          "chocolate",
          "historic"
        ],
        "desc": "A family-run granja on Carrer de Petritxol since 1941, famous for thick hot chocolate with churros or melindros."
      },
      {
        "name": "Granja La Pallaresa",
        "area": "old-town",
        "kind": [
          "chocolate",
          "historic"
        ],
        "desc": "Another classic on Petritxol, the little street known for its chocolate shops. Expect a queue on winter afternoons."
      },
      {
        "name": "Cafè de l'Òpera",
        "area": "old-town",
        "kind": [
          "historic"
        ],
        "desc": "A café on the Rambla since 1929, opposite the Liceu opera house, with its original Modernista-style interior."
      },
      {
        "name": "Nømad Coffee",
        "area": "old-town",
        "kind": [
          "coffee"
        ],
        "desc": "One of the pioneers of specialty coffee in Barcelona, in a small passage in Sant Pere."
      },
      {
        "name": "Granja M. Viader",
        "area": "old-town",
        "kind": [
          "chocolate",
          "historic"
        ],
        "desc": "A granja in the Raval since 1870, where Cacaolat, Barcelona's famous chocolate milk, was born. Try the hot chocolate with cream."
      },
      {
        "name": "Pastisseria La Colmena",
        "area": "old-town",
        "kind": [
          "pastries",
          "historic"
        ],
        "desc": "One of the oldest pastry shops in the city, on Plaça de l'Àngel, known for its traditional sweets and honey-coloured caramels."
      },
      {
        "name": "Escribà",
        "area": "eixample",
        "kind": [
          "pastries"
        ],
        "desc": "The flagship shop of the Escribà family of pastry makers on Gran Via, famous for their cakes and chocolate creations."
      },
      {
        "name": "Cafès El Magnífico",
        "area": "old-town",
        "kind": [
          "coffee",
          "historic"
        ],
        "desc": "Family coffee roasters in the Born since 1919. Come for an excellent coffee and to smell the beans being roasted."
      },
      {
        "name": "Bar Velódromo",
        "area": "eixample",
        "kind": [
          "historic",
          "local"
        ],
        "desc": "A grand café-bar from 1933 on Carrer de Muntaner, with high ceilings and a long bar, open from breakfast to late."
      },
      {
        "name": "Granja La Nena",
        "area": "gracia",
        "kind": [
          "chocolate",
          "local"
        ],
        "desc": "Gràcia's family granja for thick hot chocolate, crêpes and homemade cakes, much loved by local families."
      },
      {
        "name": "Forn Baluard",
        "area": "seafront",
        "kind": [
          "pastries",
          "local"
        ],
        "desc": "Excellent neighbourhood bakery in Barceloneta, known for its sourdough bread and pastries baked in a wood-fired oven."
      },
      {
        "name": "Cafè Salambó",
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
        "area": "seafront",
        "kind": [
          "animals"
        ],
        "desc": "Large aquarium in Port Vell, with an underwater tunnel where sharks swim overhead."
      },
      {
        "name": "Zoo de Barcelona",
        "area": "old-town",
        "kind": [
          "animals"
        ],
        "desc": "The city zoo, inside Parc de la Ciutadella."
      },
      {
        "name": "CosmoCaixa",
        "area": "uptown",
        "kind": [
          "science"
        ],
        "desc": "Hands-on science museum with a recreated Amazon flooded forest, great for curious kids."
      },
      {
        "name": "Museu de la Xocolata",
        "area": "old-town",
        "kind": [
          "treats"
        ],
        "desc": "The chocolate museum in the Born, run by the city's pastry makers, with sculptures made of chocolate."
      },
      {
        "name": "Telefèric de Montjuïc",
        "area": "montjuic",
        "kind": [
          "rides"
        ],
        "desc": "A cable car up to Montjuïc castle, with views over the port and the city."
      },
      {
        "name": "Poble Espanyol",
        "area": "montjuic",
        "kind": [
          "rides"
        ],
        "desc": "An open-air village built for the 1929 International Exhibition, with copies of buildings from all over Spain and craft workshops."
      },
      {
        "name": "Parc d'Atraccions Tibidabo",
        "area": "uptown",
        "kind": [
          "rides"
        ],
        "desc": "One of the oldest amusement parks in Europe, opened in 1901 on top of Tibidabo, with views over the whole city."
      }
    ]
  },
  "shops": {
    "label": "Historic shops",
    "img": "060 Casa Gispert, c. Sombrerers 23 (Barcelona).jpg",
    "intro": "Shops that have been part of the city for generations. Buying here keeps them alive.",
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
        "area": "old-town",
        "kind": [
          "crafts"
        ],
        "desc": "A candle shop open since 1761, often called the oldest shop in Barcelona, with a beautiful 19th-century interior."
      },
      {
        "name": "La Manual Alpargatera",
        "area": "old-town",
        "kind": [
          "crafts"
        ],
        "desc": "Handmade espadrilles since the 1940s, still made in the traditional way."
      },
      {
        "name": "Casa Gispert",
        "area": "old-town",
        "kind": [
          "food"
        ],
        "desc": "Nuts, dried fruit and coffee roasted in a wood-fired oven since 1851, in the Born."
      },
      {
        "name": "El Rei de la Màgia",
        "area": "old-town",
        "kind": [
          "crafts"
        ],
        "desc": "A magic shop open since 1881, full of tricks, posters and history."
      },
      {
        "name": "Vila Viniteca",
        "area": "old-town",
        "kind": [
          "food"
        ],
        "desc": "A family wine shop in the Born with a huge selection of Catalan and Spanish wines, and a deli next door."
      },
      {
        "name": "Els Encants",
        "area": "seafront",
        "kind": [
          "market"
        ],
        "desc": "One of the oldest flea markets in Europe, now under a huge mirrored roof at Glòries. Open a few days a week."
      },
      {
        "name": "Herboristeria del Rei",
        "area": "old-town",
        "kind": [
          "crafts"
        ],
        "desc": "A herbalist's shop open since 1823, just off Plaça Reial, with its original carved wooden interior full of drawers and jars."
      },
      {
        "name": "Ganiveteria Roca",
        "area": "old-town",
        "kind": [
          "crafts"
        ],
        "desc": "A knife and cutlery shop on Plaça del Pi since 1911, with a beautiful Modernista façade."
      },
      {
        "name": "Sombrereria Mil",
        "area": "old-town",
        "kind": [
          "fashion"
        ],
        "desc": "A traditional hat shop near Plaça Urquinaona, with berets, fedoras and Panama hats."
      },
      {
        "name": "Casa Beethoven",
        "area": "old-town",
        "kind": [
          "books"
        ],
        "desc": "A sheet-music shop on the Rambla since 1880, still selling scores to musicians from all over the city."
      },
      {
        "name": "Planelles Donat",
        "area": "old-town",
        "kind": [
          "food"
        ],
        "desc": "Turrón makers since 1850 on Portal de l'Àngel; in summer they also serve horchata and ice cream."
      },
      {
        "name": "Colmado Quílez",
        "area": "eixample",
        "kind": [
          "food"
        ],
        "desc": "A grocery on Rambla de Catalunya since 1908, with shelves to the ceiling full of wines, preserves and delicatessen."
      },
      {
        "name": "Llibreria Altaïr",
        "area": "eixample",
        "kind": [
          "books"
        ],
        "desc": "A large independent bookshop dedicated entirely to travel, maps and guidebooks."
      }
    ]
  }
};
