// csv-reader speed entry: run(input) returns csv-reader 1.0.0's exact {columns, rows, errors}.
// Same semantics as the house baseline (baselines/csv-reader/vendor/csv-reader/), hand-scanned:
// unquoted fields are sliced between delimiter positions (indexOf) instead of read char by char.
// Quoted/error paths follow the reference algorithm character for character.
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

  // readUnquoted mirrors the reference: char by char, errors included
  function readUnquoted() {
    let value = '';
    let added = 0;
    for (;;) {
      if (pos >= n) return { value, ended: 'end', added };
      const c = text[pos];
      if (c === ',') { pos += 1; return { value, ended: 'comma', added }; }
      if (c === '\n') { pos += 1; line += 1; return { value, ended: 'line break', added }; }
      if (c === '\r') {
        if (pos + 1 < n && text[pos + 1] === '\n') { pos += 2; line += 1; return { value, ended: 'line break', added }; }
        errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
        pos += 1; continue;
      }
      value += c; added += 1; pos += 1;
    }
  }

  while (pos < n) {
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
    let quoted = false;
    let ended = 'end';

    do {
      quoted = pos < n && text[pos] === '"';
      if (quoted) {
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
          pos = open + 1; line = openLine;
          errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
          const f = readUnquoted();
          fields.push('"' + f.value);
          ended = f.ended;
        } else if (pos >= n) {
          fields.push(value); ended = 'end';
        } else {
          const c2 = text[pos];
          if (c2 === ',') { pos += 1; fields.push(value); ended = 'comma'; }
          else if (c2 === '\n') { pos += 1; line += 1; fields.push(value); ended = 'line break'; }
          else if (c2 === '\r' && pos + 1 < n && text[pos + 1] === '\n') { pos += 2; line += 1; fields.push(value); ended = 'line break'; }
          else {
            const f = readUnquoted();
            if (f.added > 0) errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
            fields.push(value + f.value);
            ended = f.ended;
          }
        }
      } else {
        let value = '';
        for (;;) {
          const qe = text.indexOf('"', pos);
          const ce = text.indexOf(',', pos);
          const ne = text.indexOf('\n', pos);
          const re = text.indexOf('\r', pos);
          let qpos = -1;
          if (qe >= 0 && (qpos < 0 || qe < qpos)) qpos = qe;
          if (ce >= 0 && (qpos < 0 || ce < qpos)) qpos = ce;
          if (ne >= 0 && (qpos < 0 || ne < qpos)) qpos = ne;
          if (re >= 0 && (qpos < 0 || re < qpos)) qpos = re;
          if (qpos < 0) { value += text.slice(pos); pos = n; ended = 'end'; break; }
          value += text.slice(pos, qpos);
          const d = text[qpos];
          pos = qpos + 1;
          if (d === ',') { ended = 'comma'; break; }
          if (d === '\n') { line += 1; ended = 'line break'; break; }
          if (d === '\r') {
            if (pos < n && text[pos] === '\n') { pos += 1; line += 1; ended = 'line break'; break; }
            errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
            continue;
          }
          if (d === '"') { value += '"'; continue; }
        }
        fields.push(value);
      }
    } while (ended === 'comma');

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
