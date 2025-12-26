// Mock zustand/middleware for testing (CommonJS syntax)
module.exports = {
    persist: (config) => (set, get, api) => config(set, get, api),
    createJSONStorage: () => ({
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { }
    })
};
