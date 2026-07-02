import { Workbook } from 'exceljs';

// ────────────────────────────────────────────────────────────────
// Shared Brand Constants
// ────────────────────────────────────────────────────────────────

const COLOR_PRIMARY = 'FF1594D8';
const COLOR_TEXT_DARK = 'FF0F172A';
const COLOR_TEXT_MUTED = 'FF64748B';
const COLOR_LIGHT_YELLOW = 'FFFFF7ED';
const COLOR_BORDER_GRAY = 'FFE2E8F0';

const FONT_TITLE = { name: 'Poppins', size: 16, bold: true, color: { argb: 'FF114A73' } };
const FONT_SUBTITLE = { name: 'Inter', size: 11, italic: true, color: { argb: COLOR_TEXT_MUTED } };
const FONT_HEADER = { name: 'Poppins', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
const FONT_BODY = { name: 'Inter', size: 11, color: { argb: COLOR_TEXT_DARK } };
const FONT_TOTAL = { name: 'Inter', size: 11, bold: true, color: { argb: COLOR_TEXT_DARK } };

const borderThin = { style: 'thin' as const, color: { argb: COLOR_BORDER_GRAY } };
const borderMedium = { style: 'medium' as const, color: { argb: COLOR_TEXT_DARK } };
const borderDouble = { style: 'double' as const, color: { argb: COLOR_TEXT_DARK } };

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function setupTitleAndSubtitle(
  worksheet: any,
  title: string,
  colCount: number,
  fromDate?: string,
  toDate?: string,
) {
  const lastCol = String.fromCharCode(64 + colCount); // A=1, B=2 ...
  worksheet.mergeCells(`A1:${lastCol}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = FONT_TITLE;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 35;

  worksheet.mergeCells(`A2:${lastCol}2`);
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = `Từ ngày: ${fromDate || 'N/A'} - Đến ngày: ${toDate || 'N/A'}`;
  subtitleCell.font = FONT_SUBTITLE;
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  worksheet.getRow(3).height = 15; // spacing
}

function setupHeaderRow(worksheet: any, headers: string[], rowNum: number) {
  const headerRow = worksheet.getRow(rowNum);
  headerRow.height = 28;
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = FONT_HEADER;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARY } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
}

function applyTableBorders(worksheet: any, startRow: number, endRow: number, colCount: number) {
  for (let r = startRow; r <= endRow; r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c);
      const topBorder = r === startRow ? borderMedium : (r === endRow ? borderMedium : borderThin);
      const bottomBorder = r === endRow ? borderDouble : borderThin;
      const leftBorder = c === 1 ? borderMedium : borderThin;
      const rightBorder = c === colCount ? borderMedium : borderThin;
      cell.border = { top: topBorder, bottom: bottomBorder, left: leftBorder, right: rightBorder };
    }
  }
}

function autoFitColumns(worksheet: any) {
  worksheet.columns.forEach((column: any) => {
    let maxLength = 12;
    column.eachCell!({ includeEmpty: false }, (cell: any) => {
      if (Number(cell.row) > 3) {
        let valueStr = '';
        if (cell.value && typeof cell.value === 'object' && 'formula' in cell.value) {
          valueStr = '999,999,999 ₫';
        } else if (cell.value !== null && cell.value !== undefined) {
          if (cell.numFmt && cell.numFmt.includes('₫') && typeof cell.value === 'number') {
            valueStr = cell.value.toLocaleString('vi-VN') + ' ₫';
          } else if (typeof cell.value === 'number') {
            valueStr = cell.value.toLocaleString('vi-VN');
          } else {
            valueStr = cell.value.toString();
          }
        }
        if (valueStr.length > maxLength) maxLength = valueStr.length;
      }
    });
    column.width = maxLength + 5;
  });
}

// ────────────────────────────────────────────────────────────────
// 1. Revenue Report (existing)
// ────────────────────────────────────────────────────────────────

export interface RevenueReportItem {
  date: string;
  bookingCount: number;
  revenue: number;
}

export async function generateRevenueExcel(
  data: RevenueReportItem[],
  fromDate?: string,
  toDate?: string
): Promise<Workbook> {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet('Doanh thu');

  worksheet.views = [{ state: 'frozen', ySplit: 4, showGridLines: true }];

  setupTitleAndSubtitle(worksheet, 'BÁO CÁO DOANH THU', 3, fromDate, toDate);

  const headers = ['Ngày', 'Số booking', 'Doanh thu (VNĐ)'];
  setupHeaderRow(worksheet, headers, 4);

  worksheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 3 } };

  let currentRowNum = 5;
  data.forEach((item) => {
    const row = worksheet.getRow(currentRowNum);
    row.height = 22;

    const dateCell = row.getCell(1);
    dateCell.value = item.date;
    dateCell.font = FONT_BODY;
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };

    const countCell = row.getCell(2);
    countCell.value = Number(item.bookingCount);
    countCell.font = FONT_BODY;
    countCell.alignment = { vertical: 'middle', horizontal: 'center' };
    countCell.numFmt = '#,##0';

    const revCell = row.getCell(3);
    revCell.value = Number(item.revenue);
    revCell.font = FONT_BODY;
    revCell.alignment = { vertical: 'middle', horizontal: 'right' };
    revCell.numFmt = '#,##0" ₫"';

    currentRowNum++;
  });

  // Total row
  const totalRowNum = currentRowNum;
  const totalRow = worksheet.getRow(totalRowNum);
  totalRow.height = 26;

  const totalLabelCell = totalRow.getCell(1);
  totalLabelCell.value = 'TỔNG';
  totalLabelCell.font = FONT_TOTAL;
  totalLabelCell.alignment = { vertical: 'middle', horizontal: 'center' };

  const totalCountCell = totalRow.getCell(2);
  totalCountCell.value = { formula: `SUM(B5:B${totalRowNum - 1})` } as any;
  totalCountCell.font = FONT_TOTAL;
  totalCountCell.alignment = { vertical: 'middle', horizontal: 'center' };
  totalCountCell.numFmt = '#,##0';

  const totalRevenueCell = totalRow.getCell(3);
  totalRevenueCell.value = { formula: `SUM(C5:C${totalRowNum - 1})` } as any;
  totalRevenueCell.font = FONT_TOTAL;
  totalRevenueCell.alignment = { vertical: 'middle', horizontal: 'right' };
  totalRevenueCell.numFmt = '#,##0" ₫"';

  for (let c = 1; c <= 3; c++) {
    totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_LIGHT_YELLOW } };
  }

  applyTableBorders(worksheet, 4, totalRowNum, 3);
  autoFitColumns(worksheet);

  return workbook;
}

// ────────────────────────────────────────────────────────────────
// 2. Top Room Types by Revenue
// ────────────────────────────────────────────────────────────────

export async function generateTopRoomTypesExcel(
  data: { name: string; revenue: number; bookingCount: number }[],
  fromDate?: string,
  toDate?: string,
): Promise<Workbook> {
  const workbook = new Workbook();
  const ws = workbook.addWorksheet('Top Loại Phòng');
  ws.views = [{ state: 'frozen', ySplit: 4, showGridLines: true }];

  setupTitleAndSubtitle(ws, 'TOP LOẠI PHÒNG THEO DOANH THU', 4, fromDate, toDate);
  setupHeaderRow(ws, ['STT', 'Loại phòng', 'Số booking', 'Doanh thu (VNĐ)'], 4);

  let rowNum = 5;
  data.forEach((item, idx) => {
    const row = ws.getRow(rowNum);
    row.height = 22;
    row.getCell(1).value = idx + 1;
    row.getCell(1).font = FONT_BODY;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).value = item.name;
    row.getCell(2).font = FONT_BODY;
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(3).value = item.bookingCount;
    row.getCell(3).font = FONT_BODY;
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).numFmt = '#,##0';
    row.getCell(4).value = item.revenue;
    row.getCell(4).font = FONT_BODY;
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };
    row.getCell(4).numFmt = '#,##0" ₫"';
    rowNum++;
  });

  const totalRowNum = rowNum;
  const totalRow = ws.getRow(totalRowNum);
  totalRow.height = 26;
  totalRow.getCell(1).value = '';
  totalRow.getCell(2).value = 'TỔNG';
  totalRow.getCell(2).font = FONT_TOTAL;
  totalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
  totalRow.getCell(3).value = { formula: `SUM(C5:C${totalRowNum - 1})` } as any;
  totalRow.getCell(3).font = FONT_TOTAL;
  totalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
  totalRow.getCell(3).numFmt = '#,##0';
  totalRow.getCell(4).value = { formula: `SUM(D5:D${totalRowNum - 1})` } as any;
  totalRow.getCell(4).font = FONT_TOTAL;
  totalRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' };
  totalRow.getCell(4).numFmt = '#,##0" ₫"';
  for (let c = 1; c <= 4; c++) {
    totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_LIGHT_YELLOW } };
  }

  applyTableBorders(ws, 4, totalRowNum, 4);
  autoFitColumns(ws);
  return workbook;
}

// ────────────────────────────────────────────────────────────────
// 3. Top Booked Rooms
// ────────────────────────────────────────────────────────────────

export async function generateTopBookedRoomsExcel(
  data: { roomNumber: string; name: string; roomTypeName: string; bookingCount: number; revenue: number }[],
  fromDate?: string,
  toDate?: string,
): Promise<Workbook> {
  const workbook = new Workbook();
  const ws = workbook.addWorksheet('Top Phòng Đặt');
  ws.views = [{ state: 'frozen', ySplit: 4, showGridLines: true }];

  setupTitleAndSubtitle(ws, 'TOP PHÒNG ĐƯỢC ĐẶT NHIỀU NHẤT', 6, fromDate, toDate);
  setupHeaderRow(ws, ['STT', 'Số phòng', 'Tên phòng', 'Loại phòng', 'Số lượt đặt', 'Doanh thu (VNĐ)'], 4);

  let rowNum = 5;
  data.forEach((item, idx) => {
    const row = ws.getRow(rowNum);
    row.height = 22;
    row.getCell(1).value = idx + 1; row.getCell(1).font = FONT_BODY; row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).value = item.roomNumber; row.getCell(2).font = FONT_BODY; row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).value = item.name; row.getCell(3).font = FONT_BODY; row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(4).value = item.roomTypeName; row.getCell(4).font = FONT_BODY; row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(5).value = item.bookingCount; row.getCell(5).font = FONT_BODY; row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }; row.getCell(5).numFmt = '#,##0';
    row.getCell(6).value = item.revenue; row.getCell(6).font = FONT_BODY; row.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' }; row.getCell(6).numFmt = '#,##0" ₫"';
    rowNum++;
  });

  applyTableBorders(ws, 4, rowNum - 1, 6);
  autoFitColumns(ws);
  return workbook;
}

// ────────────────────────────────────────────────────────────────
// 4. Top VIP Customers
// ────────────────────────────────────────────────────────────────

export async function generateTopCustomersExcel(
  data: { fullName: string; email: string; phone: string | null; bookingCount: number; totalSpent: number }[],
  fromDate?: string,
  toDate?: string,
): Promise<Workbook> {
  const workbook = new Workbook();
  const ws = workbook.addWorksheet('Top Khách Hàng');
  ws.views = [{ state: 'frozen', ySplit: 4, showGridLines: true }];

  setupTitleAndSubtitle(ws, 'TOP KHÁCH HÀNG VIP', 6, fromDate, toDate);
  setupHeaderRow(ws, ['STT', 'Tên khách hàng', 'Email', 'SĐT', 'Số booking', 'Tổng chi tiêu (VNĐ)'], 4);

  let rowNum = 5;
  data.forEach((item, idx) => {
    const row = ws.getRow(rowNum);
    row.height = 22;
    row.getCell(1).value = idx + 1; row.getCell(1).font = FONT_BODY; row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).value = item.fullName; row.getCell(2).font = FONT_BODY; row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(3).value = item.email; row.getCell(3).font = FONT_BODY; row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(4).value = item.phone || '—'; row.getCell(4).font = FONT_BODY; row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(5).value = item.bookingCount; row.getCell(5).font = FONT_BODY; row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }; row.getCell(5).numFmt = '#,##0';
    row.getCell(6).value = item.totalSpent; row.getCell(6).font = FONT_BODY; row.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' }; row.getCell(6).numFmt = '#,##0" ₫"';
    rowNum++;
  });

  applyTableBorders(ws, 4, rowNum - 1, 6);
  autoFitColumns(ws);
  return workbook;
}

// ────────────────────────────────────────────────────────────────
// 5. Revenue by Source
// ────────────────────────────────────────────────────────────────

export async function generateRevenueBySourceExcel(
  data: { source: string; revenue: number }[],
  total: number,
  fromDate?: string,
  toDate?: string,
): Promise<Workbook> {
  const workbook = new Workbook();
  const ws = workbook.addWorksheet('Doanh thu theo nguồn');
  ws.views = [{ state: 'frozen', ySplit: 4, showGridLines: true }];

  setupTitleAndSubtitle(ws, 'DOANH THU THEO NGUỒN', 4, fromDate, toDate);
  setupHeaderRow(ws, ['STT', 'Nguồn', 'Doanh thu (VNĐ)', 'Tỷ trọng (%)'], 4);

  let rowNum = 5;
  data.forEach((item, idx) => {
    const row = ws.getRow(rowNum);
    row.height = 22;
    row.getCell(1).value = idx + 1; row.getCell(1).font = FONT_BODY; row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).value = item.source; row.getCell(2).font = FONT_BODY; row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(3).value = item.revenue; row.getCell(3).font = FONT_BODY; row.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' }; row.getCell(3).numFmt = '#,##0" ₫"';
    const pct = total > 0 ? (item.revenue / total) * 100 : 0;
    row.getCell(4).value = Math.round(pct * 10) / 10; row.getCell(4).font = FONT_BODY; row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }; row.getCell(4).numFmt = '0.0"%"';
    rowNum++;
  });

  const totalRow = ws.getRow(rowNum);
  totalRow.height = 26;
  totalRow.getCell(1).value = ''; totalRow.getCell(1).font = FONT_TOTAL;
  totalRow.getCell(2).value = 'TỔNG'; totalRow.getCell(2).font = FONT_TOTAL; totalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
  totalRow.getCell(3).value = total; totalRow.getCell(3).font = FONT_TOTAL; totalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' }; totalRow.getCell(3).numFmt = '#,##0" ₫"';
  totalRow.getCell(4).value = 100; totalRow.getCell(4).font = FONT_TOTAL; totalRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }; totalRow.getCell(4).numFmt = '0.0"%"';
  for (let c = 1; c <= 4; c++) {
    totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_LIGHT_YELLOW } };
  }

  applyTableBorders(ws, 4, rowNum, 4);
  autoFitColumns(ws);
  return workbook;
}

// ────────────────────────────────────────────────────────────────
// 6. Top Services
// ────────────────────────────────────────────────────────────────

export async function generateTopServicesExcel(
  data: { name: string; totalUsage: number; revenue: number }[],
  fromDate?: string,
  toDate?: string,
): Promise<Workbook> {
  const workbook = new Workbook();
  const ws = workbook.addWorksheet('Top Dịch vụ');
  ws.views = [{ state: 'frozen', ySplit: 4, showGridLines: true }];

  setupTitleAndSubtitle(ws, 'DỊCH VỤ ĐƯỢC SỬ DỤNG NHIỀU NHẤT', 4, fromDate, toDate);
  setupHeaderRow(ws, ['STT', 'Dịch vụ', 'Lượt sử dụng', 'Doanh thu (VNĐ)'], 4);

  let rowNum = 5;
  data.forEach((item, idx) => {
    const row = ws.getRow(rowNum);
    row.height = 22;
    row.getCell(1).value = idx + 1; row.getCell(1).font = FONT_BODY; row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).value = item.name; row.getCell(2).font = FONT_BODY; row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(3).value = item.totalUsage; row.getCell(3).font = FONT_BODY; row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }; row.getCell(3).numFmt = '#,##0';
    row.getCell(4).value = item.revenue; row.getCell(4).font = FONT_BODY; row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' }; row.getCell(4).numFmt = '#,##0" ₫"';
    rowNum++;
  });

  const totalRowNum = rowNum;
  const totalRow = ws.getRow(totalRowNum);
  totalRow.height = 26;
  totalRow.getCell(1).value = '';
  totalRow.getCell(2).value = 'TỔNG'; totalRow.getCell(2).font = FONT_TOTAL; totalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
  totalRow.getCell(3).value = { formula: `SUM(C5:C${totalRowNum - 1})` } as any; totalRow.getCell(3).font = FONT_TOTAL; totalRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }; totalRow.getCell(3).numFmt = '#,##0';
  totalRow.getCell(4).value = { formula: `SUM(D5:D${totalRowNum - 1})` } as any; totalRow.getCell(4).font = FONT_TOTAL; totalRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' }; totalRow.getCell(4).numFmt = '#,##0" ₫"';
  for (let c = 1; c <= 4; c++) {
    totalRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_LIGHT_YELLOW } };
  }

  applyTableBorders(ws, 4, totalRowNum, 4);
  autoFitColumns(ws);
  return workbook;
}
