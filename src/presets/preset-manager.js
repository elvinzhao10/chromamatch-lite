class PresetManager {
    constructor() {
        this.storageKey = 'chromamatch_presets';
        this.customPresets = this.loadFromStorage();
        this.presetLibrary = DEFAULT_PRESETS;
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load presets from storage:', e);
        }
        return [];
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.customPresets));
        } catch (e) {
            console.warn('Failed to save presets to storage:', e);
        }
    }

    getAllPresets() {
        return [...this.presetLibrary, ...this.customPresets];
    }

    getPresetByName(name) {
        const all = this.getAllPresets();
        return all.find(p => p.name === name) || null;
    }

    getPresetById(id) {
        const all = this.getAllPresets();
        return all.find(p => p.id === id) || null;
    }

    getBuiltInPresets() {
        return [...this.presetLibrary];
    }

    getCustomPresets() {
        return [...this.customPresets];
    }

    savePreset(preset) {
        const id = preset.id || `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullPreset = {
            ...preset,
            id,
            version: preset.version || '1.0',
            createdAt: preset.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const existingIndex = this.customPresets.findIndex(p => p.id === id);
        if (existingIndex >= 0) {
            this.customPresets[existingIndex] = fullPreset;
        } else {
            this.customPresets.push(fullPreset);
        }

        this.saveToStorage();
        return fullPreset;
    }

    deletePreset(id) {
        const index = this.customPresets.findIndex(p => p.id === id);
        if (index >= 0) {
            this.customPresets.splice(index, 1);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    renamePreset(id, newName) {
        const preset = this.customPresets.find(p => p.id === id);
        if (preset) {
            preset.name = newName;
            preset.updatedAt = new Date().toISOString();
            this.saveToStorage();
            return true;
        }
        return false;
    }

    duplicatePreset(id) {
        const preset = this.customPresets.find(p => p.id === id);
        if (preset) {
            const newPreset = {
                ...JSON.parse(JSON.stringify(preset)),
                id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: `${preset.name} (Copy)`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.customPresets.push(newPreset);
            this.saveToStorage();
            return newPreset;
        }
        return null;
    }

    exportPreset(id) {
        const preset = this.getAllPresets().find(p => p.id === id);
        if (!preset) return null;

        const exportData = {
            ...preset,
            exportedAt: new Date().toISOString(),
            application: 'ChromaMatch Lite',
            version: '1.0'
        };

        return JSON.stringify(exportData, null, 2);
    }

    importPreset(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.name || !data.graph) {
                throw new Error('Invalid preset format: missing name or graph');
            }

            const newPreset = {
                name: data.name,
                version: data.version || '1.0',
                tags: data.tags || [],
                thumbnail: data.thumbnail || null,
                graph: data.graph,
                id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                imported: true,
                originalName: data.name
            };

            this.customPresets.push(newPreset);
            this.saveToStorage();
            return newPreset;
        } catch (e) {
            console.error('Failed to import preset:', e);
            throw e;
        }
    }

    exportAllPresets() {
        const exportData = {
            presets: this.customPresets.map(p => ({
                ...p,
                exportedAt: new Date().toISOString()
            })),
            exportedAt: new Date().toISOString(),
            application: 'ChromaMatch Lite',
            version: '1.0',
            count: this.customPresets.length
        };

        return JSON.stringify(exportData, null, 2);
    }

    importAllPresets(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.presets || !Array.isArray(data.presets)) {
                throw new Error('Invalid presets file format');
            }

            let importedCount = 0;
            for (const preset of data.presets) {
                if (preset.name && preset.graph) {
                    const newPreset = {
                        ...preset,
                        id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${importedCount}`,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        imported: true
                    };
                    this.customPresets.push(newPreset);
                    importedCount++;
                }
            }

            this.saveToStorage();
            return importedCount;
        } catch (e) {
            console.error('Failed to import presets:', e);
            throw e;
        }
    }

    clearAllCustomPresets() {
        this.customPresets = [];
        this.saveToStorage();
    }

    searchPresets(query) {
        const q = query.toLowerCase();
        const all = this.getAllPresets();

        return all.filter(p => {
            if (p.name.toLowerCase().includes(q)) return true;
            if (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) return true;
            return false;
        });
    }

    getPresetsByTag(tag) {
        const all = this.getAllPresets();
        return all.filter(p => p.tags && p.tags.includes(tag));
    }

    getAllTags() {
        const tags = new Set();
        for (const p of this.getAllPresets()) {
            if (p.tags) {
                for (const t of p.tags) {
                    tags.add(t);
                }
            }
        }
        return Array.from(tags).sort();
    }
}

window.PresetManager = PresetManager;
