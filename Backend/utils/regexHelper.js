function escapeRegExp(string) {
  if (typeof string !== 'string') return string;
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

module.exports = { escapeRegExp };
