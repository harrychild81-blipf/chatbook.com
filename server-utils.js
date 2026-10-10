
/* =====================================================
   FRIENDCHAT — SHARED SERVER UTILITIES
   Pure helper functions; no routes or storage changes.
   ===================================================== */

function normalizeId(value) {
    return String(value || "")
        .trim()
        .toUpperCase();
}

function cleanText(value, maxLength = 500) {
    return String(value || "")
        .trim()
        .slice(0, maxLength);
}

function generateID(prefix) {
    return (
        prefix +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase() +
        Date.now()
            .toString(36)
            .slice(-4)
            .toUpperCase()
    );
}

module.exports = {
    normalizeId,
    cleanText,
    generateID
};
