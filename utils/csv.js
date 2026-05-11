function escapeCSV(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

module.exports = {
  escapeCSV
};
