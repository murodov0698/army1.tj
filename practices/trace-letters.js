/* Printed Tajik letters as stroke paths in a 220×300 copybook cell.
   Lines: top 46, mid 128, base 210, descender 262. */
(function () {
    const T = 46, M = 128, B = 210, D = 262, C = 110;

    function oval(cx, cy, rx, ry) {
        return `M ${cx} ${cy - ry} A ${rx} ${ry} 0 1 0 ${cx} ${cy + ry} A ${rx} ${ry} 0 1 0 ${cx} ${cy - ry}`;
    }
    function dot(cx, cy) {
        return oval(cx, cy, 9, 9);
    }

    const letters = [
        {
            lesson: 1, upper: "А", lower: "а",
            upperStrokes: [
                `M 50 ${B} L ${C} ${T}`,
                `M ${C} ${T} L 170 ${B}`,
                "M 90 142 L 136 142"
            ],
            lowerStrokes: [
                oval(96, 178, 32, 30),
                `M 62 154 C 74 ${M - 10}, 134 ${M - 4}, 128 ${M + 18} L 128 ${B}`
            ]
        },
        {
            lesson: 2, upper: "Б", lower: "б",
            upperStrokes: [
                `M 64 ${T} L 64 ${B}`,
                `M 64 ${T} C 158 ${T - 4}, 162 112, 64 124`,
                `M 64 124 C 176 114, 178 ${B + 6}, 64 ${B - 2}`
            ],
            lowerStrokes: [
                `M 74 ${T} L 74 ${B}`,
                `M 74 ${M + 6} C 168 ${M - 4}, 172 ${B + 8}, 74 ${B - 2}`
            ]
        },
        {
            lesson: 3, upper: "В", lower: "в",
            upperStrokes: [
                `M 60 ${T} L 60 ${B}`,
                `M 60 ${T + 6} C 162 ${T - 8}, 170 118, 60 124`,
                `M 60 124 C 184 114, 186 ${B + 8}, 60 ${B - 2}`
            ],
            lowerStrokes: [
                `M 78 ${M} L 78 ${B}`,
                `M 78 ${M} C 158 ${M - 6}, 156 164, 78 168`,
                `M 78 168 C 166 162, 166 ${B + 6}, 78 ${B - 2}`
            ]
        },
        {
            lesson: 4, upper: "Г", lower: "г",
            upperStrokes: [
                `M 168 ${T + 4} L 62 ${T + 4} L 62 ${B}`
            ],
            lowerStrokes: [
                `M 152 ${M + 4} L 76 ${M + 4} L 76 ${B}`
            ]
        },
        {
            lesson: 5, upper: "Ғ", lower: "ғ",
            upperStrokes: [
                `M 168 ${T + 4} L 64 ${T + 4} L 64 ${B}`,
                "M 42 128 L 100 128"
            ],
            lowerStrokes: [
                `M 150 ${M + 6} L 78 ${M + 6} L 78 ${D - 8}`,
                "M 58 186 L 112 186"
            ]
        },
        {
            lesson: 6, upper: "Д", lower: "д",
            upperStrokes: [
                `M 74 ${T} L 74 ${B - 8}`,
                `M 150 ${T} L 150 ${B - 8}`,
                `M 46 ${B - 8} L 178 ${B - 8}`,
                `M 46 ${B - 8} L 46 ${B + 24}`,
                `M 178 ${B - 8} L 178 ${B + 24}`
            ],
            lowerStrokes: [
                `M 84 ${M} L 84 ${B - 6}`,
                `M 146 ${M} L 146 ${B - 6}`,
                `M 62 ${B - 6} L 168 ${B - 6}`,
                `M 62 ${B - 6} L 62 ${D - 6}`,
                `M 168 ${B - 6} L 168 ${D - 6}`
            ]
        },
        {
            lesson: 7, upper: "Е", lower: "е",
            upperStrokes: [
                `M 58 ${T} L 58 ${B}`,
                `M 58 ${T} L 162 ${T}`,
                "M 58 128 L 142 128",
                `M 58 ${B} L 162 ${B}`
            ],
            lowerStrokes: [
                "M 68 170 L 152 170",
                "M 150 156 C 158 120, 54 110, 52 168 C 50 208, 118 224, 156 190"
            ]
        },
        {
            lesson: 8, upper: "Ё", lower: "ё",
            upperStrokes: [
                `M 58 ${T + 8} L 58 ${B}`,
                `M 58 ${T + 8} L 162 ${T + 8}`,
                "M 58 132 L 142 132",
                `M 58 ${B} L 162 ${B}`,
                dot(86, 20),
                dot(134, 20)
            ],
            lowerStrokes: [
                "M 68 170 L 152 170",
                "M 150 156 C 158 120, 54 110, 52 168 C 50 208, 118 224, 156 190",
                dot(90, 108),
                dot(132, 108)
            ]
        },
        {
            lesson: 9, upper: "Ж", lower: "ж",
            upperStrokes: [
                `M ${C} ${T} L ${C} ${B}`,
                `M 46 ${T + 8} L ${C} 128`,
                `M ${C} 128 L 46 ${B - 8}`,
                `M 174 ${T + 8} L ${C} 128`,
                `M ${C} 128 L 174 ${B - 8}`
            ],
            lowerStrokes: [
                `M ${C} ${M} L ${C} ${B}`,
                `M 58 ${M + 4} L ${C} 169`,
                `M ${C} 169 L 58 ${B - 4}`,
                `M 162 ${M + 4} L ${C} 169`,
                `M ${C} 169 L 162 ${B - 4}`
            ]
        },
        {
            lesson: 10, upper: "З", lower: "з",
            upperStrokes: [
                `M 152 74 C 52 38, 48 120, 124 128`,
                `M 124 128 C 48 140, 58 222, 160 184`
            ],
            lowerStrokes: [
                "M 146 142 C 68 122, 66 166, 122 170",
                "M 122 170 C 66 176, 72 222, 152 198"
            ]
        },
        {
            lesson: 11, upper: "И", lower: "и",
            upperStrokes: [
                `M 56 ${T} L 56 ${B}`,
                `M 56 ${T} L 164 ${B}`,
                `M 164 ${T} L 164 ${B}`
            ],
            lowerStrokes: [
                `M 68 ${M} L 68 ${B}`,
                `M 68 ${M} L 152 ${B}`,
                `M 152 ${M} L 152 ${B}`
            ]
        },
        {
            lesson: 12, upper: "Ӣ", lower: "ӣ",
            upperStrokes: [
                `M 56 ${T} L 56 ${B}`,
                `M 56 ${T} L 164 ${B}`,
                `M 164 ${T} L 164 ${B}`,
                "M 64 22 L 156 22"
            ],
            lowerStrokes: [
                `M 68 ${M} L 68 ${B}`,
                `M 68 ${M} L 152 ${B}`,
                `M 152 ${M} L 152 ${B}`,
                "M 72 108 L 148 108"
            ]
        },
        {
            lesson: 13, upper: "Й", lower: "й",
            upperStrokes: [
                `M 56 ${T} L 56 ${B}`,
                `M 56 ${T} L 164 ${B}`,
                `M 164 ${T} L 164 ${B}`,
                "M 70 30 Q 110 6 150 30"
            ],
            lowerStrokes: [
                `M 68 ${M} L 68 ${B}`,
                `M 68 ${M} L 152 ${B}`,
                `M 152 ${M} L 152 ${B}`,
                "M 78 112 Q 110 90 142 112"
            ]
        },
        {
            lesson: 14, upper: "К", lower: "к",
            upperStrokes: [
                `M 58 ${T} L 58 ${B}`,
                `M 58 132 L 168 ${T + 4}`,
                `M 58 132 L 168 ${B}`
            ],
            lowerStrokes: [
                `M 76 ${M} L 76 ${B}`,
                `M 76 164 L 158 ${M + 2}`,
                `M 76 164 L 158 ${B}`
            ]
        },
        {
            lesson: 15, upper: "К", lower: "к",
            upperStrokes: [
                `M 58 ${T} L 58 ${D}`,
                `M 58 140 L 168 ${T + 2}`,
                `M 58 140 L 158 ${B - 10}`
            ],
            lowerStrokes: [
                `M 80 ${M} L 80 ${D}`,
                `M 80 166 L 160 ${M + 4}`,
                `M 80 166 L 154 ${B - 2}`
            ]
        },
        {
            lesson: 16, upper: "Л", lower: "л",
            upperStrokes: [
                `M 48 ${B} L 100 ${T}`,
                `M 100 ${T} L 176 ${B}`
            ],
            lowerStrokes: [
                `M 62 ${B} L 102 ${M}`,
                `M 102 ${M} L 164 ${B}`
            ]
        },
        {
            lesson: 17, upper: "М", lower: "м",
            upperStrokes: [
                `M 42 ${B} L 42 ${T}`,
                `M 42 ${T} L 110 152`,
                "M 110 152 L 178 46",
                `M 178 ${T} L 178 ${B}`
            ],
            lowerStrokes: [
                `M 52 ${B} L 52 ${M}`,
                `M 52 ${M} L 110 176`,
                `M 110 176 L 168 ${M}`,
                `M 168 ${M} L 168 ${B}`
            ]
        },
        {
            lesson: 18, upper: "Н", lower: "н",
            upperStrokes: [
                `M 56 ${T} L 56 ${B}`,
                `M 164 ${T} L 164 ${B}`,
                "M 56 128 L 164 128"
            ],
            lowerStrokes: [
                `M 68 ${M} L 68 ${B}`,
                `M 152 ${M} L 152 ${B}`,
                "M 68 166 L 152 166"
            ]
        },
        {
            lesson: 19, upper: "О", lower: "о",
            upperStrokes: [oval(110, 128, 58, 82)],
            lowerStrokes: [oval(110, 169, 38, 40)]
        },
        {
            lesson: 20, upper: "П", lower: "п",
            upperStrokes: [
                `M 56 ${B} L 56 ${T}`,
                `M 56 ${T} L 164 ${T}`,
                `M 164 ${T} L 164 ${B}`
            ],
            lowerStrokes: [
                `M 68 ${B} L 68 ${M}`,
                `M 68 ${M} L 152 ${M}`,
                `M 152 ${M} L 152 ${B}`
            ]
        },
        {
            lesson: 21, upper: "Р", lower: "р",
            upperStrokes: [
                `M 62 ${T} L 62 ${B}`,
                `M 62 ${T} C 176 ${T - 6}, 178 132, 62 126`
            ],
            lowerStrokes: [
                `M 78 ${M} L 78 ${D}`,
                `M 78 ${M + 2} C 170 ${M - 4}, 172 ${B}, 78 ${B - 4}`
            ]
        },
        {
            lesson: 22, upper: "С", lower: "с",
            upperStrokes: [
                `M 160 78 C 36 28, 24 232, 164 180`
            ],
            lowerStrokes: [
                "M 148 146 C 58 118, 52 224, 150 196"
            ]
        },
        {
            lesson: 23, upper: "Т", lower: "т",
            upperStrokes: [
                `M 40 ${T + 2} L 180 ${T + 2}`,
                `M 110 ${T + 2} L 110 ${B}`
            ],
            lowerStrokes: [
                `M 64 ${M + 2} L 156 ${M + 2}`,
                `M 110 ${M + 2} L 110 ${B}`
            ]
        },
        {
            lesson: 24, upper: "У", lower: "у",
            upperStrokes: [
                `M 48 ${T + 6} L 102 152`,
                `M 174 ${T + 6} Q 128 124, 114 162 Q 104 196, 132 ${B}`
            ],
            lowerStrokes: [
                `M 62 ${M + 6} L 100 180`,
                `M 164 ${M + 6} Q 122 164, 110 190 Q 100 228, 132 ${D - 8}`
            ]
        },
        {
            lesson: 25, upper: "Ӯ", lower: "ӯ",
            upperStrokes: [
                `M 48 ${T + 6} L 102 152`,
                `M 174 ${T + 6} Q 128 124, 114 162 Q 104 196, 132 ${B}`,
                "M 62 22 L 158 22"
            ],
            lowerStrokes: [
                `M 62 ${M + 6} L 100 180`,
                `M 164 ${M + 6} Q 122 164, 110 190 Q 100 228, 132 ${D - 8}`,
                "M 74 108 L 146 108"
            ]
        },
        {
            lesson: 26, upper: "Ф", lower: "ф",
            upperStrokes: [
                "M 110 32 L 110 222",
                oval(110, 128, 54, 58)
            ],
            lowerStrokes: [
                `M 110 ${T - 4} L 110 ${D}`,
                oval(110, 169, 40, 38)
            ]
        },
        {
            lesson: 27, upper: "Х", lower: "х",
            upperStrokes: [
                `M 46 ${T} L 174 ${B}`,
                `M 174 ${T} L 46 ${B}`
            ],
            lowerStrokes: [
                `M 64 ${M} L 156 ${B}`,
                `M 156 ${M} L 64 ${B}`
            ]
        },
        {
            lesson: 28, upper: "Х", lower: "х",
            upperStrokes: [
                `M 46 ${T} L 174 ${B}`,
                `M 174 ${T} L 46 ${B}`,
                `M 110 128 L 110 ${D}`
            ],
            lowerStrokes: [
                `M 64 ${M} L 156 ${B}`,
                `M 156 ${M} L 64 ${B}`,
                `M 110 169 L 110 ${D}`
            ]
        },
        {
            lesson: 29, upper: "Ч", lower: "ч",
            upperStrokes: [
                `M 58 ${T} L 58 150 C 58 208, 166 212, 166 ${T}`
            ],
            lowerStrokes: [
                `M 70 ${M} L 70 172 C 70 ${B + 4}, 154 ${B + 6}, 154 ${M}`
            ]
        },
        {
            lesson: 30, upper: "Ҷ", lower: "ҷ",
            upperStrokes: [
                `M 56 ${T} L 56 150 C 56 206, 164 208, 164 ${T}`,
                `M 164 ${B} L 164 ${D}`
            ],
            lowerStrokes: [
                `M 68 ${M} L 68 172 C 68 ${B + 4}, 154 ${B + 4}, 154 ${M}`,
                `M 154 ${B} L 154 ${D}`
            ]
        },
        {
            lesson: 31, upper: "Ш", lower: "ш",
            upperStrokes: [
                `M 46 ${T} L 46 ${B - 6}`,
                `M 110 ${T} L 110 ${B - 6}`,
                `M 174 ${T} L 174 ${B - 6}`,
                `M 46 ${B - 6} L 174 ${B - 6}`
            ],
            lowerStrokes: [
                `M 58 ${M} L 58 ${B - 4}`,
                `M 110 ${M} L 110 ${B - 4}`,
                `M 162 ${M} L 162 ${B - 4}`,
                `M 58 ${B - 4} L 162 ${B - 4}`
            ]
        },
        {
            lesson: 32, upper: "Ъ", lower: "ъ",
            upperStrokes: [
                `M 72 ${T} L 108 ${T}`,
                `M 108 ${T} L 108 ${B}`,
                `M 108 134 C 178 122, 182 ${B + 8}, 108 ${B - 4}`
            ],
            lowerStrokes: [
                `M 84 ${M} L 112 ${M}`,
                `M 112 ${M} L 112 ${B}`,
                `M 112 166 C 172 158, 176 ${B + 6}, 112 ${B - 4}`
            ]
        },
        {
            lesson: 33, upper: "Э", lower: "э",
            upperStrokes: [
                `M 56 74 C 186 32, 192 228, 56 188`,
                "M 158 128 L 36 128"
            ],
            lowerStrokes: [
                "M 66 146 C 168 122, 172 222, 62 198",
                "M 150 172 L 48 172"
            ]
        },
        {
            lesson: 34, upper: "Ю", lower: "ю",
            upperStrokes: [
                `M 40 ${T} L 40 ${B}`,
                "M 40 128 L 86 128",
                oval(132, 128, 46, 80)
            ],
            lowerStrokes: [
                `M 58 ${M} L 58 ${B}`,
                "M 58 169 L 92 169",
                oval(126, 169, 32, 38)
            ]
        },
        {
            lesson: 35, upper: "Я", lower: "я",
            upperStrokes: [
                `M 164 ${T} L 164 ${B}`,
                `M 164 ${T} C 46 ${T - 8}, 40 134, 164 126`,
                `M 128 128 L 48 ${B}`
            ],
            lowerStrokes: [
                `M 154 ${M} L 154 ${B}`,
                `M 154 ${M} C 62 ${M - 6}, 58 172, 154 168`,
                `M 124 168 L 62 ${B}`
            ]
        }
    ];

    window.TRACE_LETTERS = letters;
})();
