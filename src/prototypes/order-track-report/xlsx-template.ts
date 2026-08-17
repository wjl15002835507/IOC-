type TemplateValidation = { field: string; values: string[]; errorTitle: string; errorMessage: string };

const encoder = new TextEncoder();
const escapeXml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[character] || character));
const columnName = (index: number) => {
  let value = index + 1;
  let result = '';
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + value % 26) + result;
    value = Math.floor(value / 26);
  }
  return result;
};
const inlineCell = (reference: string, value: unknown, style = 0) => `<c r="${reference}" t="inlineStr"${style ? ` s="${style}"` : ''}><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();
const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
const write16 = (target: Uint8Array, offset: number, value: number) => { target[offset] = value & 0xff; target[offset + 1] = (value >>> 8) & 0xff; };
const write32 = (target: Uint8Array, offset: number, value: number) => { write16(target, offset, value & 0xffff); write16(target, offset + 2, value >>> 16); };
const joinBytes = (parts: Uint8Array[]) => {
  const result = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
};
const zipFiles = (files: { name: string; content: string }[]) => {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const checksum = crc32(data);
    const localHeader = new Uint8Array(30);
    write32(localHeader, 0, 0x04034b50); write16(localHeader, 4, 20); write16(localHeader, 6, 0x0800);
    write32(localHeader, 14, checksum); write32(localHeader, 18, data.length); write32(localHeader, 22, data.length); write16(localHeader, 26, name.length);
    localParts.push(localHeader, name, data);
    const centralHeader = new Uint8Array(46);
    write32(centralHeader, 0, 0x02014b50); write16(centralHeader, 4, 20); write16(centralHeader, 6, 20); write16(centralHeader, 8, 0x0800);
    write32(centralHeader, 16, checksum); write32(centralHeader, 20, data.length); write32(centralHeader, 24, data.length); write16(centralHeader, 28, name.length); write32(centralHeader, 42, localOffset);
    centralParts.push(centralHeader, name);
    localOffset += localHeader.length + name.length + data.length;
  }
  const central = joinBytes(centralParts);
  const end = new Uint8Array(22);
  write32(end, 0, 0x06054b50); write16(end, 8, files.length); write16(end, 10, files.length); write32(end, 12, central.length); write32(end, 16, localOffset);
  return joinBytes([...localParts, central, end]);
};

export const createXlsxTemplateBytes = (fields: string[], sample: Record<string, unknown>, validations: TemplateValidation[], dataRows: Record<string, unknown>[] = []) => {
  const rowData = dataRows.length ? dataRows : [sample];
  const rows = [
    `<row r="1" ht="24" customHeight="1">${fields.map((field, index) => inlineCell(`${columnName(index)}1`, field, 1)).join('')}</row>`,
    ...rowData.map((row, rowIndex) => `<row r="${rowIndex + 2}">${fields.map((field, index) => inlineCell(`${columnName(index)}${rowIndex + 2}`, row[field] ?? '')).join('')}</row>`),
  ].join('');
  const validationEntries = validations.map((validation, validationIndex) => {
    const fieldIndex = fields.indexOf(validation.field);
    if (fieldIndex < 0 || !validation.values.length) return '';
    const column = columnName(fieldIndex);
    const configColumn = columnName(validationIndex);
    return `<dataValidation type="list" allowBlank="1" showErrorMessage="1" showInputMessage="1" errorStyle="stop" sqref="${column}2:${column}500" errorTitle="${escapeXml(validation.errorTitle)}" error="${escapeXml(validation.errorMessage)}" promptTitle="请选择配置值" prompt="选项来自对应材料配置页面"><formula1>&apos;配置项&apos;!$${configColumn}$2:$${configColumn}$${validation.values.length + 1}</formula1></dataValidation>`;
  }).filter(Boolean);
  const validationsXml = validationEntries.length ? `<dataValidations count="${validationEntries.length}">${validationEntries.join('')}</dataValidations>` : '';
  const widths = fields.map((field, index) => `<col min="${index + 1}" max="${index + 1}" width="${Math.min(32, Math.max(14, field.length * 2 + 4))}" customWidth="1"/>`).join('');
  const sheet1 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths}</cols><sheetData>${rows}</sheetData><autoFilter ref="A1:${columnName(fields.length - 1)}${rowData.length + 1}"/>${validationsXml}</worksheet>`;
  const configRows = Array.from({ length: Math.max(1, ...validations.map(validation => validation.values.length)) + 1 }, (_, rowIndex) => {
    const cells = validations.map((validation, columnIndex) => inlineCell(`${columnName(columnIndex)}${rowIndex + 1}`, rowIndex === 0 ? validation.field : validation.values[rowIndex - 1] ?? '')).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');
  const sheet2 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${configRows}</sheetData></worksheet>`;
  const files = [
    { name:'[Content_Types].xml', content:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
    { name:'_rels/.rels', content:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name:'xl/workbook.xml', content:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="导入数据" sheetId="1" r:id="rId1"/><sheet name="配置项" sheetId="2" state="hidden" r:id="rId2"/></sheets></workbook>' },
    { name:'xl/_rels/workbook.xml.rels', content:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name:'xl/styles.xml', content:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Microsoft YaHei"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Microsoft YaHei"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0C9B78"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' },
    { name:'xl/worksheets/sheet1.xml', content:sheet1 },
    { name:'xl/worksheets/sheet2.xml', content:sheet2 },
  ];
  return zipFiles(files);
};

export const createXlsxTemplate = (fields: string[], sample: Record<string, unknown>, validations: TemplateValidation[], dataRows: Record<string, unknown>[] = []) => {
  const bytes = createXlsxTemplateBytes(fields, sample, validations, dataRows);
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
