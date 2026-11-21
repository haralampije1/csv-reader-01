export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const n = text.length;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  let pos = 0;
  let line = 1;
  if (pos < n && text.charCodeAt(0) === 0xfeff) pos = 1;

  let recordLine = 1;
  let recordRow = null;

  function error(code) { errors.push({ code, line: recordLine, row: recordRow }); }

  function readUnquoted() {
    let value = '';
    let added = 0;
    while (pos < n) {
      const c = text[pos];
      if (c === ',') { pos += 1; return { value, ended: 'comma', added }; }
      if (c === '\n') { pos += 1; line += 1; return { value, ended: 'line break', added }; }
      if (c === '\r') {
        if (pos + 1 < n && text[pos + 1] === '\n') { pos += 2; line += 1; return { value, ended: 'line break', added }; }
        error('stray_cr'); pos += 1; continue;
      }
      value += c; added += 1; pos += 1;
    }
    return { value, ended: 'end', added };
  }

  function readQuoted() {
    const open = pos;
    const openLine = line;
    let value = '';
    pos += 1;
    let closed = false;
    while (pos < n) {
      const c = text[pos];
      if (c === '"') {
        if (pos + 1 < n && text[pos + 1] === '"') { value += '"'; pos += 2; continue; }
        pos += 1; closed = true; break;
      }
      if (c === '\r') { value += '\n'; line += 1; pos += (pos + 1 < n && text[pos + 1] === '\n') ? 2 : 1; continue; }
      if (c === '\n') { value += '\n'; line += 1; pos += 1; continue; }
      value += c; pos += 1;
    }
    if (!closed) {
      pos = open + 1; line = openLine; error('unterminated_quote');
      const f = readUnquoted();
      f.value = '"' + f.value;
      return f;
    }
    if (pos >= n) return { value, ended: 'end', added: 0 };
    const c2 = text[pos];
    if (c2 === ',') { pos += 1; return { value, ended: 'comma', added: 0 }; }
    if (c2 === '\n') { pos += 1; line += 1; return { value, ended: 'line break', added: 0 }; }
    if (c2 === '\r' && pos + 1 < n && text[pos + 1] === '\n') { pos += 2; line += 1; return { value, ended: 'line break', added: 0 }; }
    const junk = readUnquoted();
    if (junk.added > 0) error('quote_junk');
    value += junk.value;
    return { value, ended: junk.ended, added: 0 };
  }

  while (true) {
    while (pos < n) {
      const c = text[pos];
      if (c === '\n') { pos += 1; line += 1; }
      else if (c === '\r' && pos + 1 < n && text[pos + 1] === '\n') { pos += 2; line += 1; }
      else break;
    }
    if (pos >= n) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let field;
    let quoted = false;
    do {
      quoted = pos < n && text[pos] === '"';
      field = quoted ? readQuoted() : readUnquoted();
      fields.push(field.value);
    } while (field.ended === 'comma');

    if (fields.length === 1 && fields[0] === '' && !quoted) continue;
    if (width < 0) width = fields.length;
    if (header && columns === null) { columns = fields; continue; }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }
  return { columns: header ? (columns ?? []) : null, rows, errors };
}
