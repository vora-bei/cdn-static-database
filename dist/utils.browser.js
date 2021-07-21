"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreSharedIndices = void 0;
const restoreSharedIndices = async ({ id, baseUrl, deserialize, deserializeShared }) => {
    const loadChunk = async (options) => {
        const response = await fetch(`${baseUrl}/${id}/chunk_${options.id}.json`);
        return response.json();
    };
    const load = async (options) => {
        const response = await fetch(`${baseUrl}/${id}/index.json`, {
            method: 'GET',
            credentials: 'include',
            mode: 'no-cors',
        });
        return response.json();
    };
    return deserializeShared({ id, load }, (options) => deserialize({ ...options, load: loadChunk }));
};
exports.restoreSharedIndices = restoreSharedIndices;
//# sourceMappingURL=utils.browser.js.map