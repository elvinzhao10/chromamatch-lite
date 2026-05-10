const DEFAULT_PRESETS = [
    {
        id: "builtin_cinematic",
        name: "Cinematic Teal & Orange",
        tags: ["cinematic", "warm", "teal", "orange"],
        adjustments: {
            temperature: 15,
            tint: -10,
            saturation: 15,
            contrast: 10,
            highlights: -20,
            shadows: 10,
            method: "reinhard-lab",
            strength: 90
        }
    },
    {
        id: "builtin_vintage",
        name: "Vintage Film",
        tags: ["vintage", "film", "warm"],
        adjustments: {
            temperature: 25,
            tint: 10,
            saturation: -20,
            contrast: -15,
            highlights: -30,
            shadows: 20,
            method: "lab-histogram",
            strength: 70
        }
    },
    {
        id: "builtin_cyberpunk",
        name: "Cyberpunk Neon",
        tags: ["cyberpunk", "neon", "cool"],
        adjustments: {
            temperature: -20,
            tint: 30,
            saturation: 30,
            contrast: 25,
            highlights: 15,
            shadows: -15,
            method: "reinhard-lab",
            strength: 85
        }
    },
    {
        id: "builtin_moody",
        name: "Moody Desaturated",
        tags: ["moody", "dark", "desaturated"],
        adjustments: {
            temperature: -10,
            saturation: -40,
            contrast: 20,
            highlights: -40,
            shadows: -20,
            exposure: -10,
            method: "lab-histogram",
            strength: 80
        }
    },
    {
        id: "builtin_bright",
        name: "Bright Commercial",
        tags: ["bright", "commercial", "clean"],
        adjustments: {
            temperature: 5,
            saturation: 20,
            contrast: 15,
            highlights: -10,
            shadows: 20,
            exposure: 15,
            whites: 10,
            method: "reinhard-lab",
            strength: 70
        }
    }
];

window.DEFAULT_PRESETS = DEFAULT_PRESETS;
