const API_PROVIDERS = {
    wikimedia: {
        name: 'Wikimedia Commons', type: 'search', freeTier: 'Unlimited',
        requiresKey: false, endpoint: 'https://commons.wikimedia.org'
    },
    tmdb: {
        name: 'TMDB (Film Posters & Backdrops)', type: 'search', freeTier: 'Unlimited (free key)',
        requiresKey: true, endpoint: 'https://api.themoviedb.org/3',
        baseImageUrl: 'https://image.tmdb.org/t/p'
    },
    flickr: {
        name: 'Flickr Public Feed', type: 'search', freeTier: 'Unlimited',
        requiresKey: false, endpoint: 'https://api.flickr.com/services/feeds'
    },
    unsplash: {
        name: 'Unsplash', type: 'search', freeTier: '50 req/hour',
        requiresKey: true, endpoint: 'https://api.unsplash.com'
    },
    pexels: {
        name: 'Pexels', type: 'search', freeTier: '200 req/hour',
        requiresKey: true, endpoint: 'https://api.pexels.com'
    }
};

const FILM_DATABASE = [
    { title: "Blade Runner 2049", year: 2017, director: "Denis Villeneuve", dp: "Roger Deakins", keywords: "cyberpunk neon dystopian teal orange" },
    { title: "Blade Runner", year: 1982, director: "Ridley Scott", dp: "Jordan Cronenweth", keywords: "noir cyberpunk rain neon" },
    { title: "Mad Max: Fury Road", year: 2015, director: "George Miller", dp: "John Seale", keywords: "desert orange teal saturated action" },
    { title: "Dune", year: 2021, director: "Denis Villeneuve", dp: "Greig Fraser", keywords: "desaturated epic sand monumental" },
    { title: "Dune: Part Two", year: 2024, director: "Denis Villeneuve", dp: "Greig Fraser", keywords: "epic desert infrared" },
    { title: "The Grand Budapest Hotel", year: 2014, director: "Wes Anderson", dp: "Robert Yeoman", keywords: "pastel pink symmetrical whimsical" },
    { title: "Inception", year: 2010, director: "Christopher Nolan", dp: "Wally Pfister", keywords: "cool blue desaturated dreamlike" },
    { title: "Interstellar", year: 2014, director: "Christopher Nolan", dp: "Hoyte van Hoytema", keywords: "epic space contrast warm" },
    { title: "Dunkirk", year: 2017, director: "Christopher Nolan", dp: "Hoyte van Hoytema", keywords: "desaturated war cool blue" },
    { title: "The Revenant", year: 2015, director: "Alejandro Inarritu", dp: "Emmanuel Lubezki", keywords: "natural light cold blue wilderness" },
    { title: "1917", year: 2019, director: "Sam Mendes", dp: "Roger Deakins", keywords: "war desaturated long take" },
    { title: "Her", year: 2013, director: "Spike Jonze", dp: "Hoyte van Hoytema", keywords: "warm pink soft futuristic" },
    { title: "La La Land", year: 2016, director: "Damien Chazelle", dp: "Linus Sandgren", keywords: "vibrant magenta blue musical" },
    { title: "The Matrix", year: 1999, director: "Wachowskis", dp: "Bill Pope", keywords: "green tint cyberpunk stylized" },
    { title: "Amelie", year: 2001, director: "Jean-Pierre Jeunet", dp: "Bruno Delbonnel", keywords: "warm green red whimsical french" },
    { title: "Lost in Translation", year: 2003, director: "Sofia Coppola", dp: "Lance Acord", keywords: "cool blue tokyo moody" },
    { title: "The Godfather", year: 1972, director: "Francis Ford Coppola", dp: "Gordon Willis", keywords: "warm amber dark shadow classic" },
    { title: "Apocalypse Now", year: 1979, director: "Francis Ford Coppola", dp: "Vittorio Storaro", keywords: "jungle green orange smoke war" },
    { title: "Skyfall", year: 2012, director: "Sam Mendes", dp: "Roger Deakins", keywords: "cool blue silhouette" },
    { title: "No Country for Old Men", year: 2007, director: "Coen Brothers", dp: "Roger Deakins", keywords: "desert desaturated texas" },
    { title: "There Will Be Blood", year: 2007, director: "Paul Thomas Anderson", dp: "Robert Elswit", keywords: "dark contrast oil warm brown" },
    { title: "The Dark Knight", year: 2008, director: "Christopher Nolan", dp: "Wally Pfister", keywords: "dark blue cool contrast" },
    { title: "Drive", year: 2011, director: "Nicolas Winding Refn", dp: "Newton Thomas Sigel", keywords: "neon pink teal stylized 80s" },
    { title: "Moonlight", year: 2016, director: "Barry Jenkins", dp: "James Laxton", keywords: "blue purple contrast intimate" },
    { title: "Parasite", year: 2019, director: "Bong Joon-ho", dp: "Hong Kyung-pyo", keywords: "cool green dark contrast" },
    { title: "Joker", year: 2019, director: "Todd Phillips", dp: "Lawrence Sher", keywords: "warm orange green grimy 70s" },
    { title: "Arrival", year: 2016, director: "Denis Villeneuve", dp: "Bradford Young", keywords: "cool desaturated misty alien" },
    { title: "Sicario", year: 2015, director: "Denis Villeneuve", dp: "Roger Deakins", keywords: "desert contrast tense yellow" },
    { title: "The French Dispatch", year: 2021, director: "Wes Anderson", dp: "Robert Yeoman", keywords: "pastel colorful symmetrical" },
    { title: "Poor Things", year: 2023, director: "Yorgos Lanthimos", dp: "Robbie Ryan", keywords: "surreal vibrant steampunk" },
    { title: "Oppenheimer", year: 2023, director: "Christopher Nolan", dp: "Hoyte van Hoytema", keywords: "black white imax contrast" },
    { title: "Barbie", year: 2023, director: "Greta Gerwig", dp: "Rodrigo Prieto", keywords: "pink vibrant saturated" },
    { title: "Everything Everywhere All at Once", year: 2022, director: "Daniels", dp: "Larkin Seiple", keywords: "chaotic colorful multiverse" },
    { title: "The Batman", year: 2022, director: "Matt Reeves", dp: "Greig Fraser", keywords: "dark red noir rain grimy" },
    { title: "Whiplash", year: 2014, director: "Damien Chazelle", dp: "Sharone Meir", keywords: "warm yellow green intense" },
    { title: "Roma", year: 2018, director: "Alfonso Cuaron", dp: "Alfonso Cuaron", keywords: "black white contrast" },
    { title: "Gravity", year: 2013, director: "Alfonso Cuaron", dp: "Emmanuel Lubezki", keywords: "space blue white contrast" },
    { title: "The Social Network", year: 2010, director: "David Fincher", dp: "Jeff Cronenweth", keywords: "cool yellow dark contrast" },
    { title: "Fight Club", year: 1999, director: "David Fincher", dp: "Jeff Cronenweth", keywords: "green dark grimy stylized" },
    { title: "Pulp Fiction", year: 1994, director: "Quentin Tarantino", dp: "Andrzej Sekula", keywords: "warm saturated classic 90s" },
    { title: "Taxi Driver", year: 1976, director: "Martin Scorsese", dp: "Michael Chapman", keywords: "red neon noir gritty 70s" },
    { title: "Citizen Kane", year: 1941, director: "Orson Welles", dp: "Gregg Toland", keywords: "black white deep focus classic" },
    { title: "Lawrence of Arabia", year: 1962, director: "David Lean", dp: "Freddie Young", keywords: "epic desert golden wide" },
    { title: "Barry Lyndon", year: 1975, director: "Stanley Kubrick", dp: "John Alcott", keywords: "natural candlelight painterly" },
    { title: "The Shining", year: 1980, director: "Stanley Kubrick", dp: "John Alcott", keywords: "symmetrical cold eerie horror" },
    { title: "2001: A Space Odyssey", year: 1968, director: "Stanley Kubrick", dp: "Geoffrey Unsworth", keywords: "clean white space symmetrical" },
    { title: "Saving Private Ryan", year: 1998, director: "Steven Spielberg", dp: "Janusz Kaminski", keywords: "desaturated war hand-held gritty" },
];

const VISUAL_TECHNIQUES = [
    'silhouette', 'reflection', 'frame in a frame', 'wide shot', 'close up', 'two shot',
    'tracking', 'handheld', 'symmetry', 'tableau', 'whip pan', 'snorricam', 'split diopter',
    'underwater', 'worms eye', 'top down', 'low angle', 'high angle', 'overhead', 'ultra wide'
];

const COLOR_TERMS = [
    'teal', 'orange', 'cyan', 'warm', 'cool', 'moody', 'dark', 'bright', 'vibrant',
    'desaturated', 'pastel', 'neon', 'noir', 'vintage', 'golden', 'blue', 'green',
    'red', 'pink', 'purple', 'yellow', 'amber', 'magenta', 'monochrome'
];

const SUBJECT_TAGS = [
    'apartment', 'city', 'street', 'hallway', 'kitchen', 'bedroom', 'car interior',
    'office', 'restaurant', 'bar', 'diner', 'cafe', 'bathroom', 'forest', 'desert',
    'ocean', 'mountains', 'rain', 'snow', 'fire', 'window', 'mirror', 'silhouette',
    'crowd', 'space'
];

const VIBE_ALIASES = {
    bladerunner: ['cyberpunk', 'neon', 'rain', 'city', 'night'],
    cyberpunk: ['neon', 'city', 'night', 'practical lighting', 'rain'],
    vintage: ['film still', 'grain', 'warm', 'period'],
    moody: ['low key lighting', 'shadow', 'contrast'],
    dreamy: ['soft light', 'haze', 'pastel'],
    gritty: ['desaturated', 'handheld', 'texture'],
    commercial: ['clean lighting', 'bright', 'minimal'],
    noir: ['silhouette', 'shadow', 'practical lamp', 'window']
};

const SEARCH_TAXONOMY = {
    shotSizes: ['extreme wide', 'wide shot', 'medium shot', 'close up', 'extreme close up', 'two shot', 'insert shot'],
    framing: ['symmetry', 'centered', 'frame in a frame', 'negative space', 'overhead', 'top down', 'low angle', 'high angle'],
    lighting: ['backlit', 'soft light', 'hard light', 'practical lighting', 'window light', 'volumetric', 'low key lighting', 'rim light'],
    setting: ['interior', 'exterior', 'night', 'day', 'sunset', 'dawn', 'rain', 'fog', 'snow', 'urban', 'rural'],
    movement: ['tracking', 'handheld', 'dolly', 'static', 'whip pan'],
    aspect: ['widescreen', 'anamorphic', 'academy', 'letterboxed']
};

const TERM_NORMALIZATIONS = {
    bladerunner: 'blade runner',
    'blade-runner': 'blade runner',
    grandbudapest: 'grand budapest',
    cyberpunky: 'cyberpunk',
    cinamtic: 'cinematic',
    cinemtaic: 'cinematic',
    moodyy: 'moody',
    sillhouette: 'silhouette',
    silhoutte: 'silhouette',
    colorgrading: 'color grading',
    colour: 'color',
    colours: 'colors',
    tealorange: 'teal orange'
};

const GENERIC_FILM_WORDS = new Set([
    'dark', 'light', 'drive', 'her', 'roma', 'gravity', 'arrival', 'moonlight',
    'joker', 'barbie', 'dune', 'poor', 'things', 'lost', 'country', 'there',
    'will', 'blood', 'social', 'network', 'fight', 'club', 'taxi', 'driver'
]);

class SearchService {
    constructor() {
        this.providers = API_PROVIDERS;
        this.apiKeys = this.loadApiKeys();
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000;
        this.tmdbConfig = null;
    }

    loadApiKeys() {
        try { return JSON.parse(localStorage.getItem('chromamatch_api_keys')) || {}; }
        catch { return {}; }
    }

    saveApiKeys(keys) {
        this.apiKeys = { ...this.apiKeys, ...keys };
        localStorage.setItem('chromamatch_api_keys', JSON.stringify(this.apiKeys));
    }

    hasApiKey(provider) {
        return !this.providers[provider]?.requiresKey || !!this.apiKeys[provider];
    }

    getCached(key) {
        const c = this.cache.get(key);
        return (c && Date.now() - c.timestamp < this.cacheExpiry) ? c.data : null;
    }

    setCached(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    /* ─── TMDB ───────────────────────────────────────────────────────── */
    async setTmdbKey(key) { this.apiKeys.tmdb = key; this.tmdbConfig = null; this.saveApiKeys(this.apiKeys); }

    async getTmdbConfig() {
        if (this.tmdbConfig) return this.tmdbConfig;
        if (!this.apiKeys.tmdb) return null;
        try {
            const r = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${this.apiKeys.tmdb}`);
            const d = await r.json();
            this.tmdbConfig = d.images;
            return d.images;
        } catch { return null; }
    }

    async searchTmdb(query, options = {}) {
        if (!this.apiKeys.tmdb) return { results: [] };
        const cacheKey = `tmdb_${query}_${options.page || 1}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const r = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${this.apiKeys.tmdb}&query=${encodeURIComponent(query)}&page=${options.page || 1}`);
            const d = await r.json();
            if (!r.ok) throw new Error(d.status_message || 'TMDB error');
            const cfg = await this.getTmdbConfig();
            const baseUrl = cfg?.secure_base_url || 'https://image.tmdb.org/t/p';
            const results = [];
            for (const m of (d.results || []).slice(0, 10)) {
                const poster = m.poster_path ? `${baseUrl}/w500${m.poster_path}` : null;
                const backdrop = m.backdrop_path ? `${baseUrl}/w780${m.backdrop_path}` : null;
                if (poster) {
                    results.push({
                        id: `tmdb_${m.id}`,
                        url: `${baseUrl}/original${m.poster_path}`,
                        thumbnail: poster,
                        width: 500, height: 750,
                        description: `${m.title} (${m.release_date?.substring(0, 4) || '?'})`,
                        author: 'TMDB', source: 'tmdb'
                    });
                }
                if (backdrop && results.length < 20) {
                    results.push({
                        id: `tmdb_${m.id}_bd`,
                        url: `${baseUrl}/original${m.backdrop_path}`,
                        thumbnail: backdrop,
                        width: 780, height: 439,
                        description: `${m.title} - backdrop`,
                        author: 'TMDB', source: 'tmdb'
                    });
                }
            }
            this.setCached(cacheKey, { results });
            return { results };
        } catch (e) {
            return { results: [] };
        }
    }

    /* ─── Flickr public feed (no key) ────────────────────────────────── */
    async searchFlickr(query, options = {}) {
        const cacheKey = `flickr_${query}_${options.page || 1}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const perPage = options.perPage || 12;
            const tags = this.tokenize(query).slice(0, 4).join(',');
            const url = `https://api.flickr.com/services/feeds/photos_public.gne?format=json&nojsoncallback=1&tags=${encodeURIComponent(tags || query)}&per_page=${perPage}&tagmode=any`;
            const r = await fetch(url);
            const d = await r.json();
            const results = (d.items || []).map(item => {
                const m = item.media?.m || '';
                return {
                    id: item.link || `flickr_${Date.now()}_${Math.random()}`,
                    url: m.replace('_m.jpg', '_b.jpg').replace('_m.', '_b.'),
                    thumbnail: m,
                    width: 500, height: 375,
                    description: item.title || '',
                    author: item.author?.replace('nobody@flickr.com ("', '').replace('")', '') || 'Flickr',
                    source: 'flickr'
                };
            }).filter(r => r.thumbnail);
            this.setCached(cacheKey, { results });
            return { results };
        } catch { return { results: [] }; }
    }

    /* ─── Wikimedia ───────────────────────────────────────────────────── */
    async searchWikimedia(query, options = {}) {
        const cacheKey = `wikimedia_${query}_${options.page || 1}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const params = new URLSearchParams({
            action: 'query', generator: 'search', gsrsearch: query,
            gsrnamespace: 6, gsrlimit: options.perPage || 12,
            gsroffset: ((options.page || 1) - 1) * (options.perPage || 12),
            prop: 'imageinfo', iiprop: 'url|size|mime', iiurlwidth: 200,
            format: 'json', origin: '*'
        });
        try {
            const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
            const d = await r.json();
            const results = [];
            if (d.query?.pages) {
                for (const pid in d.query.pages) {
                    const p = d.query.pages[pid];
                    if (p.imageinfo?.[0]?.mime?.startsWith('image/')) {
                        const ii = p.imageinfo[0];
                        results.push({
                            id: p.pageid.toString(),
                            url: ii.url,
                            thumbnail: ii.thumburl,
                            width: ii.width, height: ii.height,
                            description: p.title.replace('File:', ''),
                            author: 'Wikimedia', source: 'wikimedia'
                        });
                    }
                }
            }
            this.setCached(cacheKey, { results });
            return { results };
        } catch { return { results: [] }; }
    }

    /* ─── Unsplash ────────────────────────────────────────────────────── */
    async searchUnsplash(query, options = {}) {
        if (!this.apiKeys.unsplash) return { results: [] };
        const cacheKey = `unsplash_${query}_${options.page || 1}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${options.perPage || 12}&page=${options.page || 1}`, {
                headers: { 'Authorization': `Client-ID ${this.apiKeys.unsplash}` }
            });
            const d = await r.json();
            const results = (d.results || []).map(p => ({
                id: p.id, url: p.urls.regular, thumbnail: p.urls.small,
                width: p.width, height: p.height,
                description: p.alt_description || '', author: p.user?.name || '', source: 'unsplash'
            }));
            this.setCached(cacheKey, { results });
            return { results };
        } catch { return { results: [] }; }
    }

    /* ─── Pexels ─────────────────────────────────────────────────────── */
    async searchPexels(query, options = {}) {
        if (!this.apiKeys.pexels) return { results: [] };
        const cacheKey = `pexels_${query}_${options.page || 1}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;
        try {
            const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${options.perPage || 12}&page=${options.page || 1}`, {
                headers: { 'Authorization': this.apiKeys.pexels }
            });
            const d = await r.json();
            const results = (d.photos || []).map(p => ({
                id: p.id.toString(),
                url: p.src.large2x || p.src.large, thumbnail: p.src.small,
                width: p.width, height: p.height,
                description: p.alt || '', author: p.photographer || '', source: 'pexels'
            }));
            this.setCached(cacheKey, { results });
            return { results };
        } catch { return { results: [] }; }
    }

    /* ─── Multi-source search ─────────────────────────────────────────── */
    async search(query, sources = ['wikimedia', 'flickr'], options = {}) {
        const results = [];
        const seen = new Set();
        const allSources = this.resolveAvailableSources(sources.length > 0 ? sources : ['wikimedia', 'flickr']);

        const tasks = allSources.map(source => {
            switch (source) {
                case 'wikimedia': return this.searchWikimedia(query, options);
                case 'flickr': return this.searchFlickr(query, options);
                case 'tmdb': return this.searchTmdb(query, options);
                case 'unsplash': return this.searchUnsplash(query, options);
                case 'pexels': return this.searchPexels(query, options);
                default: return Promise.resolve({ results: [] });
            }
        });

        const settled = await Promise.allSettled(tasks);
        for (const s of settled) {
            if (s.status === 'fulfilled' && s.value?.results) {
                for (const r of s.value.results) {
                    const key = r.url || r.id;
                    if (!seen.has(key)) { seen.add(key); results.push(r); }
                }
            }
        }
        return { results };
    }

    resolveAvailableSources(sources) {
        const requested = sources?.length ? sources : ['wikimedia', 'flickr'];
        const available = requested.filter((source) => this.hasApiKey(source));
        if (available.length) return available;
        return ['wikimedia', 'flickr'];
    }

    /* ─── Smart search ────────────────────────────────────────────────── */
    matchFilm(query) {
        if (!query || query.length < 2) return null;
        const q = this.normalizeQuery(query);
        let best = null, bestScore = 0;
        for (const f of FILM_DATABASE) {
            let score = 0;
            let titleSignal = false;
            const t = this.normalizeQuery(f.title);
            if (t === q) score = 100;
            else if (t.includes(q) && q.length >= 3) {
                score = 80 + (q.length / t.length) * 20;
                titleSignal = true;
            } else if (q.includes(t)) {
                score = 75;
                titleSignal = true;
            }
            else {
                const words = q.split(/\s+/);
                const tWords = t.split(/\s+/);
                const significantTitleWords = tWords.filter((word) => word.length >= 4 && !GENERIC_FILM_WORDS.has(word));
                let matched = 0;
                for (const w of words) {
                    if (w.length < 3) continue;
                    for (const tw of significantTitleWords) {
                        if (tw === w || tw.startsWith(w) || w.startsWith(tw)) { matched++; break; }
                    }
                }
                if (matched > 0) {
                    score = (matched / Math.max(significantTitleWords.length || 1, 1)) * 70;
                    titleSignal = true;
                }
                for (const w of words) {
                    if (w.length < 3) continue;
                    if (f.keywords.split(/\s+/).includes(w)) score += 15;
                }
                if (f.director.toLowerCase().includes(q)) score = Math.max(score, 60);
                if (f.dp.toLowerCase().includes(q)) score = Math.max(score, 55);
                if (String(f.year) === q) score = Math.max(score, 50);
                if (!titleSignal && score < 40) score = 0;
            }
            if (score > bestScore) { bestScore = score; best = f; }
        }
        return bestScore >= 30 ? best : null;
    }

    classifyQuery(query) {
        const lower = this.normalizeQuery(query);
        const film = this.matchFilm(query);
        const facets = this.extractFacets(query);
        if (film) return { type: 'film', film, facets };
        if (/^\d{4}$/.test(query.trim())) return { type: 'year', year: query.trim(), facets };
        if (/\b(film|movie|cinema|cinematography|director|dp|shot|still)\b/i.test(lower)) return { type: 'film-keyword', facets };
        const styleRe = /\b(teal|orange|cyan|warm|cool|moody|dark|bright|vibrant|desaturated|pastel|neon|noir|vintage|cyberpunk|cinematic|retro|golden|blue|green|red|pink|purple|yellow)\b/i;
        const hasStyle = styleRe.test(lower);
        const isShort = lower.split(/\s+/).length <= 4;
        if (hasStyle && isShort) return { type: 'style', facets };
        if (hasStyle || lower.length > 30) return { type: 'descriptive', facets };
        return { type: 'keyword', facets };
    }

    extractFacets(query) {
        const lower = this.normalizeQuery(query);
        const colors = COLOR_TERMS.filter((term) => lower.includes(term));
        const techniques = VISUAL_TECHNIQUES.filter((term) => lower.includes(term));
        const subjects = SUBJECT_TAGS.filter((term) => lower.includes(term));
        const vibes = Object.keys(VIBE_ALIASES).filter((term) => lower.includes(term));
        const peopleHints = /\b(director|cinematographer|dp|production designer)\b/.test(lower);
        const taxonomy = this.parseTaxonomy(lower);

        return {
            colors,
            techniques,
            subjects,
            vibes,
            peopleHints,
            taxonomy
        };
    }

    canonicalizeQuery(query) {
        return query
            .toLowerCase()
            .replace(/\bblade\s*runner\b/g, 'bladerunner')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    normalizeQuery(query) {
        let normalized = this.canonicalizeQuery(query);
        for (const [from, to] of Object.entries(TERM_NORMALIZATIONS)) {
            normalized = normalized.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
        }
        return normalized
            .replace(/\bbladerunner\b/g, 'blade runner')
            .replace(/\s+/g, ' ')
            .trim();
    }

    parseTaxonomy(normalizedQuery) {
        const matches = {};
        for (const [group, terms] of Object.entries(SEARCH_TAXONOMY)) {
            matches[group] = terms.filter((term) => normalizedQuery.includes(term));
        }
        return matches;
    }

    editDistance(a, b) {
        if (a === b) return 0;
        if (!a.length) return b.length;
        if (!b.length) return a.length;
        const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i++) {
            let prev = i - 1;
            dp[0] = i;
            for (let j = 1; j <= b.length; j++) {
                const nextPrev = dp[j];
                dp[j] = Math.min(
                    dp[j] + 1,
                    dp[j - 1] + 1,
                    prev + (a[i - 1] === b[j - 1] ? 0 : 1)
                );
                prev = nextPrev;
            }
        }
        return dp[b.length];
    }

    fuzzyIncludes(haystack, needle) {
        const normalizedHaystack = this.normalizeQuery(haystack);
        const normalizedNeedle = this.normalizeQuery(needle);
        if (!normalizedNeedle) return false;
        if (normalizedHaystack.includes(normalizedNeedle)) return true;

        const hayTokens = normalizedHaystack.split(/\s+/).filter(Boolean);
        const needleTokens = normalizedNeedle.split(/\s+/).filter(Boolean);
        if (!needleTokens.length || !hayTokens.length) return false;

        return needleTokens.every((needleToken) =>
            hayTokens.some((hayToken) =>
                hayToken === needleToken ||
                hayToken.startsWith(needleToken) ||
                needleToken.startsWith(hayToken) ||
                (Math.abs(hayToken.length - needleToken.length) <= 1 && this.editDistance(hayToken, needleToken) <= 1)
            )
        );
    }

    joinUniqueTerms(parts) {
        return [...new Set(parts.filter(Boolean).flatMap((part) => String(part).split(/\s+/).filter(Boolean)))].join(' ');
    }

    buildSearchQueries(query) {
        const c = this.classifyQuery(query);
        if (c.type === 'film' && c.film) {
            const f = c.film;
            const shotTerms = c.facets?.taxonomy?.shotSizes?.slice(0, 1) || [];
            const lightingTerms = c.facets?.taxonomy?.lighting?.slice(0, 1) || [];
            return [...new Set([
                f.title,
                `${f.title} ${f.year}`,
                `${f.title} cinematography still`,
                `${f.title} color palette`,
                `${f.title} widescreen frame`,
                `${f.title} ${shotTerms.join(' ')} ${lightingTerms.join(' ')}`.trim(),
                f.keywords
            ].filter(Boolean))];
        }
        if (c.type === 'descriptive') {
            const stop = new Set(['a','an','the','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','can','i','me','my','we','our','you','your','he','she','it','they','them','this','that','these','those','with','for','and','but','or','nor','not','to','of','in','on','at','by','from','up','down','out','off','over','want','need','like','look','looking','find','search','give','show','make','scene','image','photo','picture','reference','film','movie','cinematic','color','colors','palette','grade','grading','style','look','feel','vibe','some','any','all','each','every','both','few','more','most','other','very','really','quite','just','so','too','also','only','even','still','get','got','getting','please','help','try','trying','going']);
            const words = this.normalizeQuery(query).split(/[\s,]+/).filter(w => w.length >= 3 && !stop.has(w));
            if (!words.length) return [query];
            const qs = [words.join(' ')];
            if (words.length > 3) {
                qs.push(words.slice(0, 3).join(' '));
                qs.push(words.slice(-3).join(' '));
            }
            const vibeTerms = c.facets?.vibes?.flatMap((vibe) => VIBE_ALIASES[vibe] || []) || [];
            const techniqueTerms = c.facets?.techniques || [];
            const taxonomyTerms = Object.values(c.facets?.taxonomy || {}).flat().slice(0, 4);
            const subjectTerms = c.facets?.subjects?.slice(0, 2) || [];
            return [...new Set([
                ...qs,
                `${words.slice(0, 4).join(' ')} cinematography`,
                `${words.slice(0, 4).join(' ')} color grading`,
                this.joinUniqueTerms([...words.slice(0, 3), ...vibeTerms.slice(0, 2), ...techniqueTerms.slice(0, 2)]),
                this.joinUniqueTerms([...subjectTerms, ...taxonomyTerms.slice(0, 2), ...c.facets.colors.slice(0, 2), 'movie still']),
                this.joinUniqueTerms([...subjectTerms, ...taxonomyTerms.slice(0, 2), ...vibeTerms.slice(0, 2), 'cinematic frame'])
            ])];
        }
        const taxonomyTerms = Object.values(c.facets?.taxonomy || {}).flat().slice(0, 3);
        return [...new Set([
            query,
            `${query} cinematography`,
            `${query} color palette`,
            `${query} movie still`,
            this.joinUniqueTerms([query, ...taxonomyTerms])
        ])];
    }

    tokenize(query) {
        return query
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((token) => token.length >= 3);
    }

    inferPreferredSources(classification, requestedSources) {
        if (requestedSources?.length) {
            return requestedSources;
        }

        if (classification?.type === 'film' || classification?.type === 'film-keyword') {
            return ['tmdb', 'wikimedia', 'flickr', 'unsplash', 'pexels'];
        }

        if (classification?.type === 'style' || classification?.type === 'descriptive') {
            return ['unsplash', 'pexels', 'wikimedia', 'flickr'];
        }

        return ['wikimedia', 'flickr', 'unsplash', 'pexels'];
    }

    resolveMode(mode) {
        switch (mode) {
            case 'cinema':
                return this.resolveAvailableSources(['tmdb', 'wikimedia', 'flickr', 'unsplash', 'pexels']);
            case 'photo':
                return this.resolveAvailableSources(['unsplash', 'pexels', 'wikimedia', 'flickr']);
            case 'archive':
                return this.resolveAvailableSources(['wikimedia', 'flickr']);
            case 'ai':
            default:
                return this.resolveAvailableSources(['tmdb', 'unsplash', 'pexels', 'wikimedia', 'flickr']);
        }
    }

    rankResults(results, query, classification) {
        const tokens = this.tokenize(query);
        const facets = classification?.facets || {};
        const sourceWeights = {
            tmdb: classification?.type === 'film' ? 1.35 : 1.05,
            unsplash: classification?.type === 'style' || classification?.type === 'descriptive' ? 1.2 : 1.0,
            pexels: classification?.type === 'style' || classification?.type === 'descriptive' ? 1.18 : 1.0,
            wikimedia: 1.0,
            flickr: 0.92
        };

        return results
            .map((result, index) => {
                const haystack = `${result.description || ''} ${result.author || ''} ${result.source || ''}`.toLowerCase();
                let score = sourceWeights[result.source] || 1;
                const canonicalHaystack = this.normalizeQuery(haystack);

                for (const token of tokens) {
                    if (this.fuzzyIncludes(canonicalHaystack, token)) {
                        score += 0.45;
                    }
                }

                if (classification?.film?.title && this.fuzzyIncludes(haystack, classification.film.title)) {
                    score += 1.3;
                }

                for (const color of facets.colors || []) {
                    if (this.fuzzyIncludes(canonicalHaystack, color)) score += 0.28;
                }

                for (const technique of facets.techniques || []) {
                    if (this.fuzzyIncludes(canonicalHaystack, technique)) score += 0.4;
                }

                for (const subject of facets.subjects || []) {
                    if (this.fuzzyIncludes(canonicalHaystack, subject)) score += 0.2;
                }

                for (const group of Object.values(facets.taxonomy || {})) {
                    for (const term of group) {
                        if (this.fuzzyIncludes(canonicalHaystack, term)) score += 0.22;
                    }
                }

                if (classification?.type === 'film' || classification?.type === 'film-keyword') {
                    if (/poster|cover|logo|fan art|bluray|dvd|soundtrack/.test(canonicalHaystack)) {
                        score -= 1.4;
                    }
                    if (/backdrop|still|scene|frame|cinematography/.test(canonicalHaystack)) {
                        score += 1.1;
                    }
                }

                if (classification?.type === 'style' || classification?.type === 'descriptive') {
                    if (/portrait|headshot|selfie/.test(canonicalHaystack)) {
                        score -= 0.8;
                    }
                    if (/lighting|moody|cinematic|sunset|night|neon|interior|landscape/.test(canonicalHaystack)) {
                        score += 0.65;
                    }
                }

                const aspect = result.width && result.height ? result.width / Math.max(result.height, 1) : 1;
                if (aspect > 1.2) {
                    score += 0.14;
                }
                if ((classification?.type === 'film' || classification?.type === 'film-keyword') && aspect < 0.8) {
                    score -= 0.7;
                }
                if ((classification?.type === 'style' || classification?.type === 'descriptive') && aspect < 0.7) {
                    score -= 0.35;
                }
                if ((result.width || 0) >= 1000 || (result.height || 0) >= 1000) {
                    score += 0.12;
                }
                if (/screenshot|gallery|wallpaper|blog/.test(canonicalHaystack)) {
                    score -= 0.25;
                }
                if (/illustration|painting|drawing|vector|icon|logo|poster art|concept art/.test(canonicalHaystack)) {
                    score -= 0.9;
                }
                if (/frame|still|stills|shot|cinema|cinematography|scene/.test(canonicalHaystack)) {
                    score += 0.35;
                }
                if (/interview|behind the scenes|press|festival|red carpet/.test(canonicalHaystack)) {
                    score -= 0.75;
                }

                score += Math.max(0, 0.18 - index * 0.01);
                return { ...result, _score: score };
            })
            .sort((a, b) => b._score - a._score)
            .map(({ _score, ...result }) => result);
    }

    async searchMultiQuery(queries, sources, options = {}) {
        const collected = [];
        const seen = new Set();

        for (const query of queries.slice(0, 5)) {
            const { results } = await this.search(query, sources, options);
            for (const result of results) {
                const key = result.url || result.id;
                if (!seen.has(key)) {
                    seen.add(key);
                    collected.push(result);
                }
            }

            if (collected.length >= (options.limit || 18)) {
                break;
            }
        }

        return collected;
    }

    async smartSearch(rawQuery, webSources) {
        const c = this.classifyQuery(rawQuery);
        const queries = this.buildSearchQueries(rawQuery);
        const preferredSources = this.inferPreferredSources(c, webSources);
        let allResults = [];

        try {
            allResults = await this.searchMultiQuery(queries, preferredSources, { perPage: 10, limit: 18 });
        } catch {}

        if (allResults.length === 0) {
            const fallbackQuery = rawQuery.split(/\s+/).filter(w => w.length >= 3).slice(0, 3).join(' ');
            try {
                allResults = await this.searchMultiQuery(
                    [fallbackQuery || rawQuery],
                    ['wikimedia', 'flickr'],
                    { perPage: 10, limit: 12 }
                );
            } catch {}
        }

        return {
            results: this.rankResults(allResults, rawQuery, c),
            filmMatch: c.film || null,
            classification: c
        };
    }

    /* ─── AI-driven search ───────────────────────────────────────────── */
    async aiDrivenSearch(userQuery, aiConfig) {
        const { provider, baseUrl, apiKey, model, sources, contextHint } = aiConfig;
        if (!apiKey || !baseUrl) {
            return this.smartSearch(userQuery, ['wikimedia', 'flickr']);
        }

        const classification = this.classifyQuery(userQuery);
        const allResults = [];
        const seen = new Set();
        const searchSources = this.resolveAvailableSources(sources?.length ? sources : this.inferPreferredSources(classification));

        try {
            const providerKey = provider || 'openai';
            const adapter = typeof UnifiedSession !== 'undefined' ? new UnifiedSession() : null;
            const providerConfig = PROVIDER_CONFIGS?.[providerKey];
            if (!adapter || !providerConfig) {
                throw new Error('AI search adapter unavailable');
            }

            const request = adapter.buildChatRequest(
                providerKey,
                { provider: providerKey, baseUrl, apiKey, chatModel: model || providerConfig.chatModels?.[0]?.value || '' },
                [{ role: 'user', text: contextHint || userQuery }],
                `You optimize fuzzy search for color grading reference images.
Return exactly 4 short search queries, one per line.
Prioritize:
- film stills or cinematic frames when the user hints at movies
- lighting, palette, mood, lens, environment, shot size, framing, and time-of-day terms
- convert vague taste into concrete visual tags like "widescreen frame", "practical lighting", "night exterior", "symmetrical composition"
- no explanations
- no numbering
- avoid generic words like "beautiful", "nice", "cool" unless paired with concrete visual terms
Detected search mode: ${classification.type}
Detected facets: ${JSON.stringify(classification.facets)}`
            );

            const r = await fetch(request.url, {
                method: 'POST',
                headers: request.headers,
                body: JSON.stringify(request.body)
            });
            const data = await r.json();
            if (!r.ok) {
                throw new Error(data?.error?.message || data?.message || String(r.status));
            }
            const text = providerConfig.parseChatReply(data) || '';
            const aiQueries = text.split('\n').map(l => l.replace(/^[\d.\-\s]+/, '').trim()).filter(l => l.length >= 2);

            const allQueries = [...new Set([...aiQueries.slice(0, 4), ...this.buildSearchQueries(userQuery)])];

            for (const q of allQueries.slice(0, 5)) {
                try {
                    const { results } = await this.search(q, searchSources, { perPage: 10 });
                    for (const r of results) {
                        const key = r.url || r.id;
                        if (!seen.has(key)) { seen.add(key); allResults.push(r); }
                    }
                } catch {}
                if (allResults.length >= 16) break;
            }
        } catch {
            const fb = await this.smartSearch(userQuery, searchSources);
            return fb;
        }

        return {
            results: this.rankResults(allResults, userQuery, classification),
            filmMatch: this.matchFilm(userQuery),
            classification,
            aiDriven: true
        };
    }
}

window.SearchService = SearchService;
window.API_PROVIDERS = API_PROVIDERS;
