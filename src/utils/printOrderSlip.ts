import QRCode from 'qrcode';
import { formatPeso, formatDateOnly } from './formatters';
import type { Order, OrderItem } from '../types/app';

const ITEMS_PER_PAGE = 10;
const BUSINESS_NAME = 'FEU ALABANG';
const LOGO_SRC = '/logo.png';

function chunkItems<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSlipPage(
  order: Order,
  pageItems: OrderItem[],
  pageNum: number,
  totalPages: number,
  qrDataUrl: string,
  copyLabel: string,
  isLastPage: boolean,
  totalAmount: number,
): string {
  const discountAmount = 0;
  const deliveryFee = 0;
  const finalTotal = totalAmount - discountAmount + deliveryFee;

  const theadClass = copyLabel === 'ORIGINAL' ? 'thead-original' : 'thead-duplicate';
  const copyLabelClass = copyLabel === 'ORIGINAL' ? 'copy-label-original' : 'copy-label-duplicate';

  const itemRows = pageItems
    .map(
      (item) => `
      <tr>
        <td class="tc">${item.quantity}</td>
        <td class="tc">—</td>
        <td class="td-product">${escapeHtml(item.product_name || `Product #${item.product_id}`)}</td>
        <td class="tr">${escapeHtml(formatPeso(item.price ?? 0))}</td>
        <td class="tr">${escapeHtml(formatPeso((item.quantity ?? 0) * (item.price ?? 0)))}</td>
      </tr>`,
    )
    .join('');

  const emptyRows = Array.from(
    { length: ITEMS_PER_PAGE - pageItems.length },
    () => `
      <tr class="empty-row">
        <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
      </tr>`,
  ).join('');

  const totalRow = isLastPage
    ? `<div class="slip-summary-layout">
        <div class="summary-top">
          <div class="qr-wrap">
            <img class="qr-img" src="${qrDataUrl}" alt="Order #${order.order_id} QR" />
          </div>
          <div class="totals-block">
            <div class="slip-totals-grid">
              <span>Subtotal:</span>
              <strong class="tr">${escapeHtml(formatPeso(totalAmount))}</strong>
              <span>Discount:</span>
              <strong class="tr">${escapeHtml(formatPeso(discountAmount))}</strong>
              <span>Delivery:</span>
              <strong class="tr">FREE</strong>
              <span class="total-label total-divider">Total:</span>
              <strong class="tr total-value total-divider">${escapeHtml(formatPeso(finalTotal))}</strong>
            </div>
          </div>
        </div>
        <div class="payment-block" aria-label="Mode of Payment">
          <span class="payment-title">Mode of Payment (Rider Check):</span>
          <div class="payment-options">
            <label><span class="payment-box"></span>COD</label>
            <label><span class="payment-box"></span>Check</label>
            <label><span class="payment-box"></span>Cashless (GCash / Maya / Bank Transfer)</label>
          </div>
        </div>
       </div>`
    : '';

  const addressRow = order.address
    ? `<div class="meta-row full-width"><span class="meta-key">Address:</span><span>${escapeHtml(order.address)}</span></div>`
    : '';

  return `
  <div class="slip-page slip-page-${copyLabel.toLowerCase()}">
    <div class="slip-header">
      <div class="header-top">
        <div class="brand-wrap">
          <img class="brand-logo" src="${LOGO_SRC}" alt="${escapeHtml(BUSINESS_NAME)} logo" />
          <div class="title-wrap">
            <span class="business-name">${escapeHtml(BUSINESS_NAME)}</span>
          </div>
        </div>
        <div class="header-right">
          <span class="page-label">Page ${pageNum} of ${totalPages}</span>
          <span class="copy-label ${copyLabelClass}">${escapeHtml(copyLabel)}</span>
        </div>
      </div>
      <div class="header-title-wrap">
        <span class="slip-title">ORDER SLIP</span>
      </div>
    </div>
    <div class="slip-meta">
      <div class="meta-row"><span class="meta-key">Customer:</span><span>${escapeHtml(order.customer_name || `Customer #${order.customer_id}`)}</span></div>
      <div class="meta-row meta-right"><span class="order-num">No. ${String(order.order_id).padStart(4, '0')}</span></div>
      <div class="meta-row"><span class="meta-key">Contact:</span><span>${escapeHtml(order.contact_no || 'N/A')}</span></div>
      <div class="meta-row meta-right"><span class="meta-key">Date:</span><span>${escapeHtml(formatDateOnly(order.order_date))}</span></div>
      ${addressRow}
    </div>
    <div class="items-table-wrap"><table class="items-table">
      <thead class="${theadClass}">
        <tr>
          <th class="tc" style="width:10%">Qty</th>
          <th class="tc" style="width:11%">Unit</th>
          <th style="width:39%">Product</th>
          <th class="tr" style="width:20%">Price</th>
          <th class="tr" style="width:20%">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        ${emptyRows}
      </tbody>
    </table></div>
    ${totalRow}
    <div class="slip-bottom">
      <div class="footer-note">THANK YOU AND GOD BLESS!</div>
    </div>
  </div>`;
}

export async function printOrderSlip(order: Order): Promise<void> {
  const qrDataUrl = await QRCode.toDataURL(String(order.order_id), {
    width: 120,
    margin: 1,
  });

  const items = order.items ?? [];
  const pages = chunkItems(items, ITEMS_PER_PAGE);
  const totalPages = pages.length;
  const totalAmount = items.reduce(
    (sum, item) => sum + (item.quantity ?? 0) * (item.price ?? 0),
    0,
  );

  const buildCopyPages = (copyLabel: string) =>
    pages
      .map((pageItems, idx) =>
        buildSlipPage(
          order,
          pageItems,
          idx + 1,
          totalPages,
          qrDataUrl,
          copyLabel,
          idx === totalPages - 1,
          totalAmount,
        ),
      )
      .join('');

  const allContent =
    buildCopyPages('ORIGINAL') + buildCopyPages('DUPLICATE');

  const popup = window.open('', '_blank', 'width=520,height=780');
  if (!popup) return;

  popup.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Order Slip #${order.order_id}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page {
      size: 105mm 148mm;
      margin: 0;
    }

    html, body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 9pt;
      background: #fff;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page container ── */
    .slip-page {
      width: 105mm;
      height: 148mm;
      padding: 5mm 5mm 4mm;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      overflow: hidden;
    }
    .slip-page:last-child {
      page-break-after: avoid;
    }

    /* ── Header ── */
    .slip-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 1.5mm;
    }
    .header-top {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2mm;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 2mm;
      min-width: 0;
    }
    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.8mm;
      flex-shrink: 0;
    }
    .brand-logo {
      width: 11mm;
      height: 11mm;
      object-fit: contain;
      flex-shrink: 0;
    }
    .title-wrap {
      display: flex;
      flex-direction: column;
    }
    .business-name {
      font-size: 12pt;
      line-height: 1;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #0f172a;
    }
    .header-title-wrap {
      width: 100%;
      margin-top: 0.8mm;
      text-align: center;
    }
    .slip-title {
      display: inline-block;
      font-size: 9pt;
      font-weight: bold;
      letter-spacing: 1.3px;
      color: #0f172a;
    }
    .copy-label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18mm;
      font-size: 7.5pt;
      font-weight: bold;
      text-align: center;
      color: #fff;
      border: 1px solid transparent;
      border-radius: 999px;
      padding: 0.55mm 2.1mm;
      letter-spacing: 1px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      box-shadow: inset 0 -0.5mm 0 rgba(0, 0, 0, 0.12);
    }
    .copy-label-original {
      background: #14532d;
      border-color: #14532d;
    }
    .copy-label-duplicate {
      background: #c41a1a;
      border-color: #c41a1a;
    }

    /* ── Meta info ── */
    .slip-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 2.2mm;
      row-gap: 0.7mm;
      margin-bottom: 1.5mm;
      padding: 1mm 1.2mm;
      border: 0.5px solid #d1d5db;
      border-radius: 1.5mm;
      background: #f8fafc;
    }
    .meta-row {
      display: flex;
      align-items: center;
      font-size: 7.5pt;
      line-height: 1.45;
      gap: 1mm;
      min-width: 0;
      color: #0f172a;
    }
    .meta-row.full-width {
      grid-column: 1 / -1;
    }
    .meta-key {
      font-weight: bold;
      flex-shrink: 0;
      white-space: nowrap;
      color: #334155;
    }
    .meta-right {
      justify-content: flex-end;
      text-align: right;
    }
    .meta-right .meta-key {
      min-width: 0;
    }
    .order-num {
      display: inline-block;
      font-size: 9pt;
      line-height: 1;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.3px;
    }

    /* ── Items table ── */
    .items-table-wrap {
      flex: 1;
      margin-bottom: 1.5mm;
      border: 0.5px solid #94a3b8;
      border-radius: 1.2mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .items-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      table-layout: fixed;
      flex: 1;
    }
    .items-table th,
    .items-table td {
      border-right: 0.5px solid #cbd5e1;
      border-bottom: 0.5px solid #cbd5e1;
      padding: 0.6mm 1.2mm;
      font-size: 7.5pt;
      line-height: 1.35;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .items-table th {
      font-weight: bold;
      color: #fff;
      text-align: center;
      text-transform: uppercase;
      text-overflow: clip;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .items-table th:last-child,
    .items-table td:last-child {
      border-right: 0;
    }
    .items-table tbody tr:last-child td {
      border-bottom: 0;
    }
    .thead-original th {
      background: #14532d;
    }
    .thead-duplicate th {
      background: #c41a1a;
    }
    .items-table .empty-row td {
      border-color: #e2e8f0;
      background: #f8fafc;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .td-product {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tc { text-align: center; }
    .tr { text-align: right; }

    /* ── Summary ── */
    .slip-summary-layout {
      display: flex;
      flex-direction: column;
      border: 0.5px solid #cbd5e1;
      border-radius: 1.5mm;
      background: #f8fafc;
      margin-bottom: 1.5mm;
      overflow: hidden;
    }
    .summary-top {
      display: flex;
      align-items: stretch;
    }
    .qr-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1mm 1.5mm;
      border-right: 0.5px solid #cbd5e1;
      flex-shrink: 0;
    }
    .qr-img {
      width: 18mm;
      height: 18mm;
    }
    .totals-block {
      flex: 1;
      padding: 1mm 1.2mm;
    }
    .slip-totals-grid {
      display: grid;
      grid-template-columns: 1fr auto;
      row-gap: 0.5mm;
      font-size: 8pt;
    }
    .total-label {
      font-size: 8.5pt;
      font-weight: bold;
    }
    .total-value {
      font-size: 8.5pt;
    }
    .total-divider {
      border-top: 0.35px solid #cbd5e1;
      padding-top: 0.45mm;
      margin-top: 0.1mm;
    }
    .payment-block {
      border-top: 0.5px solid #cbd5e1;
      padding: 0.8mm 1.2mm;
    }
    .payment-title {
      display: block;
      font-size: 7.2pt;
      font-weight: bold;
      margin-bottom: 0.4mm;
      color: #334155;
    }
    .payment-options {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5mm 2.5mm;
      font-size: 7pt;
    }
    .payment-options label {
      display: flex;
      align-items: center;
      gap: 0.8mm;
    }
    .payment-box {
      width: 2.5mm;
      height: 2.5mm;
      border: 0.5px solid #64748b;
      display: inline-block;
      flex-shrink: 0;
    }

    /* ── Footer ── */
    .slip-bottom {
      margin-top: auto;
      border-top: 0.8px solid #cbd5e1;
      padding-top: 0.8mm;
    }
    .slip-page-original .slip-bottom {
      border-top-color: #14532d;
    }
    .slip-page-duplicate .slip-bottom {
      border-top-color: #c41a1a;
    }
    .page-label {
      font-size: 7pt;
      color: #475569;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    .footer-note {
      margin-top: 0.8mm;
      text-align: center;
      font-size: 7pt;
      font-weight: bold;
      letter-spacing: 0.3px;
      color: #1f2937;
    }

    @media screen {
      body { background: #ccc; }
      .slip-page {
        background: #fff;
        margin: 4mm auto;
        box-shadow: 0 2px 6px rgba(0,0,0,.25);
      }
    }

    @media print {
      body { background: white; }
    }
  </style>
</head>
<body>
${allContent}
<script>
  window.onload = function () { window.print(); };
</script>
</body>
</html>`);

  popup.document.close();
}
