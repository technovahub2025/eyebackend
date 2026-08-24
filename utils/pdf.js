const fs = require('fs');
const path = require('path');

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT_MARGIN = 28;
const RIGHT_MARGIN = 28;
const TOP_MARGIN = 44;
const BOTTOM_MARGIN = 44;
const IMAGE_PATH = path.join(__dirname, '../../frontend/src/asset/pdf.jpeg');
const IMAGE_OBJECT_NUMBER = 4;
const IMAGE_WIDTH = 104;
const IMAGE_HEIGHT = 104;
const IMAGE_GAP = 16;
const FIRST_PAGE_START_Y = PAGE_HEIGHT - TOP_MARGIN - 34 - 16 - IMAGE_HEIGHT - IMAGE_GAP - 20;

const TITLE_FONT_SIZE = 18;
const META_FONT_SIZE = 9.5;
const HEADER_FONT_SIZE = 9.5;
const CELL_FONT_SIZE = 9.2;
const LINE_HEIGHT = 12;

const TABLE_COLUMNS = [
  { key: 'title', label: 'Title', width: 70 },
  { key: 'name', label: 'Name', width: 150 },
  { key: 'age', label: 'Age', width: 42, align: 'center' },
  { key: 'gender', label: 'Gender', width: 80, align: 'center' },
  { key: 'phone', label: 'Phone', width: 90 },
  { key: 'createdAt', label: 'Created At', width: 107 },
];

function escapePdfText(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function formatDateTime(value) {
  if (!value) {
    return 'No date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function measureChars(text, fontSize) {
  return Math.max(1, Math.floor(text / (fontSize * 0.52)));
}

function wrapText(text, maxChars) {
  const normalized = String(text ?? '').trim();
  if (!normalized) {
    return [''];
  }

  const words = normalized.split(/\s+/);
  const lines = [];
  let current = words.shift() || '';

  for (const word of words) {
    if ((current + ' ' + word).length <= maxChars) {
      current += ` ${word}`;
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

function getRowValue(row, key) {
  if (key === 'createdAt') {
    return formatDateTime(row.createdAt);
  }

  if (key === 'title') {
    return row.title || (row.gender === 'Male' ? 'Mr' : row.gender === 'Female' ? 'Mrs' : 'N/A');
  }

  return row[key] ?? row.fullName ?? row.name ?? 'N/A';
}

function buildTermsPdf(rows) {
  const title = 'VisionGift - Terms Page Data Export';
  const generatedAt = new Date().toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const safeRows = Array.isArray(rows) ? rows : [];
  const availableWidth = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
  const imageBuffer = fs.readFileSync(IMAGE_PATH);
  const imageData = imageBuffer.toString('latin1');
  const imageDimensions = readImageDimensions(imageBuffer);

  const columns = TABLE_COLUMNS.map((column) => ({
    ...column,
    x: 0,
  }));

  let runningX = LEFT_MARGIN;
  for (const column of columns) {
    column.x = runningX;
    runningX += column.width;
  }

  const rowGap = 8;
  const headerRowHeight = 20;
  const titleBlockHeight = 34;
  const metaBlockHeight = 16;
  const startY = FIRST_PAGE_START_Y;
  const bottomLimit = BOTTOM_MARGIN + 22;

  const preparedRows = safeRows.map((row, index) => {
    const cells = columns.map((column) => {
      const rawValue = getRowValue(row, column.key);
      const maxChars = measureChars(column.width - 16, CELL_FONT_SIZE);
      const wrapped = wrapText(rawValue, Math.max(8, maxChars));
      return {
        ...column,
        value: rawValue,
        lines: wrapped,
      };
    });

    const maxLines = Math.max(1, ...cells.map((cell) => cell.lines.length));
    const height = Math.max(24, maxLines * LINE_HEIGHT + 10);

    return {
      index,
      cells,
      height,
    };
  });

  const pages = [];
  let currentPage = [];
  let currentY = startY;

  for (const row of preparedRows) {
    const requiredHeight = row.height + rowGap;
    const needsNewPage = currentPage.length > 0 && currentY - requiredHeight < bottomLimit;

    if (needsNewPage) {
      pages.push(currentPage);
      currentPage = [];
      currentY = startY;
    }

    currentPage.push(row);
    currentY -= requiredHeight;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  const objects = [];
  const catalogObjectNumber = 1;
  const pagesObjectNumber = 2;
  const fontObjectNumber = 3;

  const pageObjectNumbers = pages.map((_, index) => 5 + index * 2);
  const contentObjectNumbers = pages.map((_, index) => 6 + index * 2);

  objects.push({
    number: fontObjectNumber,
    body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  });

  objects.push({
    number: IMAGE_OBJECT_NUMBER,
    body:
      `<< /Type /XObject /Subtype /Image /Width ${imageDimensions.width} ` +
      `/Height ${imageDimensions.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
      `/Filter /DCTDecode /Length ${imageBuffer.length} >>\nstream\n${imageData}\nendstream`,
  });

  pages.forEach((pageRows, pageIndex) => {
    const content = buildPageContent({
      rows: pageRows,
      pageNumber: pageIndex + 1,
      totalPages: pages.length,
      title,
      generatedAt,
      columns,
      titleBlockHeight,
      metaBlockHeight,
      headerRowHeight,
      startY,
      availableWidth,
      includeImage: pageIndex === 0,
      imageObjectNumber: IMAGE_OBJECT_NUMBER,
      imageWidth: IMAGE_WIDTH,
      imageHeight: IMAGE_HEIGHT,
      imageGap: IMAGE_GAP,
    });

    objects.push({
      number: contentObjectNumbers[pageIndex],
      body: `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
    });

    objects.push({
      number: pageObjectNumbers[pageIndex],
      body:
        `<< /Type /Page /Parent ${pagesObjectNumber} 0 R ` +
        `/MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] ` +
        `/Resources << /Font << /F1 ${fontObjectNumber} 0 R >>` +
        (pageIndex === 0 ? ` /XObject << /Im1 ${IMAGE_OBJECT_NUMBER} 0 R >>` : '') +
        ` >> ` +
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
    offsets[object.number] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${object.number} 0 obj\n${object.body}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  const maxObjectNumber = objects[objects.length - 1].number;

  pdf += `xref\n0 ${maxObjectNumber + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let number = 1; number <= maxObjectNumber; number += 1) {
    const offset = offsets[number] ?? 0;
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObjectNumber + 1} /Root ${catalogObjectNumber} 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'latin1');
}

function buildPageContent({
  rows,
  pageNumber,
  totalPages,
  title,
  generatedAt,
  columns,
  titleBlockHeight,
  metaBlockHeight,
  headerRowHeight,
  startY,
  availableWidth,
  includeImage,
  imageObjectNumber,
  imageWidth,
  imageHeight,
  imageGap,
}) {
  const parts = [];
  const escape = escapePdfText;

  parts.push('q');
  parts.push('BT');
  parts.push(`/F1 ${TITLE_FONT_SIZE} Tf`);
  parts.push(`1 0 0 1 ${LEFT_MARGIN} ${PAGE_HEIGHT - TOP_MARGIN} Tm`);
  parts.push(`(${escape(title)}) Tj`);
  parts.push('ET');

  parts.push('BT');
  parts.push(`/F1 ${META_FONT_SIZE} Tf`);
  parts.push(`1 0 0 1 ${LEFT_MARGIN} ${PAGE_HEIGHT - TOP_MARGIN - titleBlockHeight} Tm`);
  parts.push(`(Generated: ${escape(generatedAt)}) Tj`);
  parts.push('ET');

  parts.push('BT');
  parts.push(`/F1 ${META_FONT_SIZE} Tf`);
  parts.push(`1 0 0 1 ${LEFT_MARGIN + 280} ${PAGE_HEIGHT - TOP_MARGIN - titleBlockHeight} Tm`);
  parts.push(`(Page ${pageNumber} of ${totalPages}) Tj`);
  parts.push('ET');

  if (includeImage) {
    const imageX = LEFT_MARGIN + (availableWidth - imageWidth) / 2;
    const imageY =
      PAGE_HEIGHT - TOP_MARGIN - titleBlockHeight - metaBlockHeight - imageHeight - imageGap;
    parts.push('q');
    parts.push(`${imageWidth.toFixed(2)} 0 0 ${imageHeight.toFixed(2)} ${imageX.toFixed(2)} ${imageY.toFixed(2)} cm`);
    parts.push(`/Im${imageObjectNumber - 3} Do`);
    parts.push('Q');
  }

  const tableTopY = startY;
  const headerY = tableTopY;
  const headerTextY = headerY - 14;
  let rowTopY = headerY - headerRowHeight;

  drawRect(parts, LEFT_MARGIN, headerY - headerRowHeight, availableWidth, headerRowHeight, {
    fill: '0.92 0.95 1 rg',
    stroke: '0.62 0.69 0.91 RG',
  });

  for (const column of columns) {
    drawRect(parts, column.x, headerY - headerRowHeight, column.width, headerRowHeight, {
      stroke: '0.62 0.69 0.91 RG',
    });
    writeText(parts, column.label, column.x + 6, headerTextY, {
      fontSize: HEADER_FONT_SIZE,
      align: 'left',
      bold: true,
    });
  }

  if (rows.length === 0) {
    const emptyHeight = 38;
    const emptyY = rowTopY - emptyHeight;
    drawRect(parts, LEFT_MARGIN, emptyY, availableWidth, emptyHeight, {
      stroke: '0.80 0.82 0.88 RG',
    });
    writeText(parts, 'No terms submissions found.', LEFT_MARGIN + 10, emptyY + 13, {
      fontSize: CELL_FONT_SIZE,
    });
    parts.push('Q');
    return parts.join('\n');
  }

  rows.forEach((row, rowIndex) => {
    const rowHeight = row.height;
    const rowY = rowTopY - rowHeight;
    const fillColor = rowIndex % 2 === 0 ? '0.99 0.99 1 rg' : '1 1 1 rg';

    drawRect(parts, LEFT_MARGIN, rowY, availableWidth, rowHeight, {
      fill: fillColor,
      stroke: '0.84 0.86 0.92 RG',
    });

    row.cells.forEach((cell) => {
      drawRect(parts, cell.x, rowY, cell.width, rowHeight, {
        stroke: '0.84 0.86 0.92 RG',
      });

      const paddingX = 6;
      const paddingTop = 9;
      const maxTextWidth = cell.width - paddingX * 2;
      const textX =
        cell.align === 'center'
          ? cell.x + cell.width / 2
          : cell.x + paddingX;
      const textY = rowY + rowHeight - paddingTop;

      cell.lines.slice(0, 6).forEach((line, lineIndex) => {
        const offsetY = lineIndex * LINE_HEIGHT;
        writeText(parts, line, textX, textY - offsetY, {
          fontSize: CELL_FONT_SIZE,
          align: cell.align || 'left',
          maxWidth: maxTextWidth,
        });
      });
    });

    rowTopY = rowY - 8;
  });

  parts.push('Q');
  return parts.join('\n');
}

function drawRect(parts, x, y, width, height, { fill, stroke } = {}) {
  if (fill) {
    parts.push(fill);
    parts.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
  }

  if (stroke) {
    parts.push(stroke);
    parts.push(`${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`);
  }
}

function writeText(parts, text, x, y, { fontSize, align = 'left', maxWidth = null } = {}) {
  const safe = escapePdfText(text);
  const widthEstimate = maxWidth || textWidthEstimate(text, fontSize);
  let startX = x;

  if (align === 'center') {
    startX = x - widthEstimate / 2;
  } else if (align === 'right') {
    startX = x - widthEstimate;
  }

  parts.push('BT');
  parts.push('0 0 0 rg');
  parts.push(`/F1 ${fontSize} Tf`);
  parts.push(`1 0 0 1 ${startX.toFixed(2)} ${y.toFixed(2)} Tm`);
  parts.push(`(${safe}) Tj`);
  parts.push('ET');
}

function textWidthEstimate(text, fontSize) {
  return String(text).length * fontSize * 0.52;
}

function readImageDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error('pdf.jpeg must be a JPEG image');
  }

  let offset = 2;
  while (offset < buffer.length) {
    while (buffer[offset] === 0xff) {
      offset += 1;
    }

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const length = buffer.readUInt16BE(offset);
    if (
      marker >= 0xc0 &&
      marker <= 0xc3 &&
      offset + 5 < buffer.length
    ) {
      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      return { width, height };
    }

    offset += length;
  }

  throw new Error('Could not read pdf.jpeg dimensions');
}

module.exports = {
  buildTermsPdf,
};
