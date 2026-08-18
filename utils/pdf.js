const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT_MARGIN = 48;
const RIGHT_MARGIN = 48;
const TOP_MARGIN = 54;
const BOTTOM_MARGIN = 54;
const FONT_SIZE = 11;
const LINE_HEIGHT = 16;

function escapePdfText(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [''];
  }

  const lines = [];
  let current = words[0];

  for (let index = 1; index < words.length; index += 1) {
    const word = words[index];
    if ((current + ' ' + word).length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function formatRecordLine(label, value) {
  return `${label}: ${value ?? 'N/A'}`;
}

function buildTermsPdf(rows) {
  const generatedAt = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const introLines = [
    'VisionGift - Terms Page Data Export',
    `Generated: ${generatedAt}`,
    `Total records: ${rows.length}`,
    '',
  ];

  const bodyLines = rows.flatMap((row, index) => {
    const createdAt = row.createdAt
      ? new Date(row.createdAt).toLocaleString('en-GB')
      : 'No date';

    return [
      `Record ${index + 1}`,
      formatRecordLine('Title', row.title),
      formatRecordLine('Name', row.name),
      formatRecordLine('Age', row.age),
      formatRecordLine('Gender', row.gender),
      formatRecordLine('Created At', createdAt),
      '',
    ];
  });

  const maxCharsPerLine = 82;
  const allLines = [...introLines, ...bodyLines].flatMap((line) => wrapText(line, maxCharsPerLine));

  const reservedSpace = 86;
  const linesPerPage = Math.max(
    1,
    Math.floor((PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN - reservedSpace) / LINE_HEIGHT)
  );
  const pages = [];

  for (let start = 0; start < allLines.length; start += linesPerPage) {
    pages.push(allLines.slice(start, start + linesPerPage));
  }

  if (pages.length === 0) {
    pages.push(['No terms submissions found.']);
  }

  const objects = [];
  const catalogObjectNumber = 1;
  const pagesObjectNumber = 2;
  const fontObjectNumber = 3;

  const pageObjectNumbers = pages.map((_, index) => 4 + index * 2);
  const contentObjectNumbers = pages.map((_, index) => 5 + index * 2);

  objects.push({
    number: fontObjectNumber,
    body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  });

  pages.forEach((pageLines, pageIndex) => {
    const content = buildPageContent(pageLines, pageIndex + 1, pages.length);
    objects.push({
      number: contentObjectNumbers[pageIndex],
      body: `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`,
    });

    objects.push({
      number: pageObjectNumbers[pageIndex],
      body:
        `<< /Type /Page /Parent ${pagesObjectNumber} 0 R ` +
        `/MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] ` +
        `/Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> ` +
        `/Contents ${contentObjectNumbers[pageIndex]} 0 R >>`,
    });
  });

  objects.push({
    number: pagesObjectNumber,
    body: `<< /Type /Pages /Kids [${pageObjectNumbers.map((num) => `${num} 0 R`).join(' ')}] /Count ${pages.length} >>`,
  });

  objects.push({
    number: catalogObjectNumber,
    body: `<< /Type /Catalog /Pages ${pagesObjectNumber} 0 R >>`,
  });

  objects.sort((a, b) => a.number - b.number);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets[object.number] = Buffer.byteLength(pdf, 'utf8');
    pdf += `${object.number} 0 obj\n${object.body}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  const maxObjectNumber = objects[objects.length - 1].number;

  pdf += `xref\n0 ${maxObjectNumber + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let number = 1; number <= maxObjectNumber; number += 1) {
    const offset = offsets[number] ?? 0;
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObjectNumber + 1} /Root ${catalogObjectNumber} 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

function buildPageContent(lines, pageNumber, totalPages) {
  const titleY = PAGE_HEIGHT - TOP_MARGIN;
  const footerY = BOTTOM_MARGIN - 10;
  const safeLines = lines.map(escapePdfText);

  const parts = [
    'BT',
    `/F1 18 Tf`,
    `1 0 0 1 ${LEFT_MARGIN} ${titleY} Tm`,
    `(VisionGift Admin Export) Tj`,
    `/F1 ${FONT_SIZE} Tf`,
    `1 0 0 1 ${LEFT_MARGIN} ${titleY - 28} Tm`,
  ];

  safeLines.forEach((line, index) => {
    if (index === 0) {
      parts.push(`(${line}) Tj`);
    } else {
      parts.push('T*');
      parts.push(`(${line}) Tj`);
    }
  });

  parts.push('ET');
  parts.push('BT');
  parts.push(`/F1 9 Tf`);
  parts.push(`1 0 0 1 ${LEFT_MARGIN} ${footerY} Tm`);
  parts.push(`(Page ${pageNumber} of ${totalPages}) Tj`);
  parts.push('ET');

  return parts.join('\n');
}

module.exports = {
  buildTermsPdf,
};
