import { Workbook } from 'exceljs';

export interface RevenueReportItem {
  date: string;          // VD: 10/06/2026
  bookingCount: number;  // Số booking
  revenue: number;       // Doanh thu
}

/**
 * Generates a beautifully styled Excel workbook for the revenue report.
 * 
 * @param data Array of revenue report items
 * @param fromDate Start date string (dd/MM/yyyy or YYYY-MM-DD)
 * @param toDate End date string (dd/MM/yyyy or YYYY-MM-DD)
 * @returns exceljs Workbook instance
 */
export async function generateRevenueExcel(
  data: RevenueReportItem[],
  fromDate?: string,
  toDate?: string
): Promise<Workbook> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Doanh thu');

  // Ensure gridlines are visible
  worksheet.views = [
    {
      state: 'frozen',
      ySplit: 4, // Freeze top 4 rows (headers always visible)
      showGridLines: true,
    },
  ];

  // --- BRAND COLORS (DTUVIVU Minimalist Luxury) ---
  const COLOR_PRIMARY = 'FF1594D8';      // Sky Blue (Header Background)
  const COLOR_TEXT_DARK = 'FF0F172A';    // Dark Slate (Grid lines, borders, text)
  const COLOR_TEXT_MUTED = 'FF64748B';   // Slate Gray
  const COLOR_LIGHT_YELLOW = 'FFFFF7ED'; // Soft Gold Cream (Total background)
  const COLOR_GOLD_BORDER = 'FFF5C26B';  // Accent gold border
  const COLOR_BORDER_GRAY = 'FFE2E8F0';  // Thin grid lines

  // --- FONTS ---
  const FONT_TITLE = {
    name: 'Poppins',
    size: 16,
    bold: true,
    color: { argb: 'FF114A73' }, // Dark primary blue for title
  };

  const FONT_SUBTITLE = {
    name: 'Inter',
    size: 11,
    italic: true,
    color: { argb: COLOR_TEXT_MUTED },
  };

  const FONT_HEADER = {
    name: 'Poppins',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' }, // White text on primary color
  };

  const FONT_BODY = {
    name: 'Inter',
    size: 11,
    color: { argb: COLOR_TEXT_DARK },
  };

  const FONT_TOTAL = {
    name: 'Inter',
    size: 11,
    bold: true,
    color: { argb: COLOR_TEXT_DARK },
  };

  // --- BORDERS ---
  const borderThin = { style: 'thin' as const, color: { argb: COLOR_BORDER_GRAY } };
  const borderMedium = { style: 'medium' as const, color: { argb: COLOR_TEXT_DARK } };
  const borderDouble = { style: 'double' as const, color: { argb: COLOR_TEXT_DARK } };

  // --- Title (Row 1) ---
  worksheet.mergeCells('A1:C1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'BÁO CÁO DOANH THU';
  titleCell.font = FONT_TITLE;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 35;

  // --- Subtitle / Date range (Row 2) ---
  worksheet.mergeCells('A2:C2');
  const subtitleCell = worksheet.getCell('A2');
  
  // Format display dates
  const displayFrom = fromDate || 'N/A';
  const displayTo = toDate || 'N/A';
  subtitleCell.value = `Từ ngày: ${displayFrom} - Đến ngày: ${displayTo}`;
  subtitleCell.font = FONT_SUBTITLE;
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  // Row 3 is a blank spacing row
  worksheet.getRow(3).height = 15;

  // --- Header Row (Row 4) ---
  const headerRow = worksheet.getRow(4);
  headerRow.height = 28;
  
  const headers = ['Ngày', 'Số booking', 'Doanh thu (VNĐ)'];
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = FONT_HEADER;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_PRIMARY },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  // Enable auto filter for headers (A4:C4)
  worksheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: 3 },
  };

  // --- Data Rows (Row 5+) ---
  let currentRowNum = 5;
  data.forEach((item) => {
    const row = worksheet.getRow(currentRowNum);
    row.height = 22;

    // Date (Col 1)
    const dateCell = row.getCell(1);
    dateCell.value = item.date;
    dateCell.font = FONT_BODY;
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Booking Count (Col 2)
    const countCell = row.getCell(2);
    countCell.value = Number(item.bookingCount);
    countCell.font = FONT_BODY;
    countCell.alignment = { vertical: 'middle', horizontal: 'center' };
    countCell.numFmt = '#,##0'; // Integer number format

    // Revenue (Col 3)
    const revCell = row.getCell(3);
    revCell.value = Number(item.revenue);
    revCell.font = FONT_BODY;
    revCell.alignment = { vertical: 'middle', horizontal: 'right' };
    revCell.numFmt = '#,##0" ₫"'; // Currency format: 120.000 ₫

    currentRowNum++;
  });

  // --- Total Row ---
  const totalRowNum = currentRowNum;
  const totalRow = worksheet.getRow(totalRowNum);
  totalRow.height = 26;

  // Labels & Formulas
  const totalLabelCell = totalRow.getCell(1);
  totalLabelCell.value = 'TỔNG';
  totalLabelCell.font = FONT_TOTAL;
  totalLabelCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // SUM Formula for booking count (Col 2)
  const totalCountCell = totalRow.getCell(2);
  totalCountCell.value = { formula: `SUM(B5:B${totalRowNum - 1})` } as any;
  totalCountCell.font = FONT_TOTAL;
  totalCountCell.alignment = { vertical: 'middle', horizontal: 'center' };
  totalCountCell.numFmt = '#,##0';

  // SUM Formula for revenue (Col 3)
  const totalRevenueCell = totalRow.getCell(3);
  totalRevenueCell.value = { formula: `SUM(C5:C${totalRowNum - 1})` } as any;
  totalRevenueCell.font = FONT_TOTAL;
  totalRevenueCell.alignment = { vertical: 'middle', horizontal: 'right' };
  totalRevenueCell.numFmt = '#,##0" ₫"';

  // Style the total row cells with light gold background
  for (let c = 1; c <= 3; c++) {
    const cell = totalRow.getCell(c);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_LIGHT_YELLOW },
    };
  }

  // --- TABLE BORDERS (Outer border thick, inner thin, total row special top/bottom) ---
  // The table boundaries are: Row 4 to totalRowNum, Column 1 to 3
  for (let r = 4; r <= totalRowNum; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= 3; c++) {
      const cell = row.getCell(c);
      
      // Determine individual borders
      const topBorder = r === 4 ? borderMedium : (r === totalRowNum ? borderMedium : borderThin);
      const bottomBorder = r === totalRowNum ? borderDouble : borderThin;
      const leftBorder = c === 1 ? borderMedium : borderThin;
      const rightBorder = c === 3 ? borderMedium : borderThin;

      cell.border = {
        top: topBorder,
        bottom: bottomBorder,
        left: leftBorder,
        right: rightBorder,
      };
    }
  }

  // --- AUTO FIT COLUMN WIDTHS ---
  worksheet.columns.forEach((column, colIdx) => {
    let maxLength = 12; // Min width

    column.eachCell!({ includeEmpty: false }, (cell) => {
      // Skip merged title rows (1, 2) and blank row (3) to avoid skewed column widths
      if (Number(cell.row) > 3) {
        let valueStr = '';
        if (cell.value && typeof cell.value === 'object' && 'formula' in cell.value) {
          // It's a formula, we cannot easily read the evaluated value on export,
          // so estimate width based on typical totals
          valueStr = colIdx === 2 ? '999,999' : '999,999,999 ₫';
        } else if (cell.value !== null && cell.value !== undefined) {
          if (cell.numFmt && cell.numFmt.includes('₫') && typeof cell.value === 'number') {
            valueStr = cell.value.toLocaleString('vi-VN') + ' ₫';
          } else if (typeof cell.value === 'number') {
            valueStr = cell.value.toLocaleString('vi-VN');
          } else {
            valueStr = cell.value.toString();
          }
        }
        
        if (valueStr.length > maxLength) {
          maxLength = valueStr.length;
        }
      }
    });

    // Add padding to ensure characters fit and no ### error displays
    column.width = maxLength + 5;
  });

  return workbook;
}
