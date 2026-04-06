import QRCode from 'qrcode';
import { formatPeso, formatDateOnly } from './formatters';
import { DELIVERY_STATUS_LABELS } from '../types/delivery';
import type { Order, OrderItem } from '../types/app';
import type { DeliveryStatusKey } from '../types/delivery';

const ITEMS_PER_PAGE = 10;

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
  startIndex: number,
  pageNum: number,
  totalPages: number,
  qrDataUrl: string,
  copyLabel: string,
  isLastPage: boolean,
  totalAmount: number,
): string {
  const statusLabel =
    DELIVERY_STATUS_LABELS[order.delivery_status as DeliveryStatusKey] ||
    escapeHtml(order.delivery_status);

  const itemRows = pageItems
    .map(
      (item, idx) => `
      <tr>
        <td class="tc">${startIndex + idx + 1}</td>
        <td class="td-product">${escapeHtml(item.product_name || `Product #${item.product_id}`)}</td>
        <td class="tc">${item.quantity}</td>
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
    ? `<div class="slip-total">
        <span>Total Amount:</span>
        <strong>${escapeHtml(formatPeso(totalAmount))}</strong>
       </div>`
    : '';

  const addressRow = order.address
    ? `<div class="meta-row"><span class="meta-key">Address:</span><span>${escapeHtml(order.address)}</span></div>`
    : '';

  const contactRow = order.contact_no
    ? `<div class="meta-row"><span class="meta-key">Contact:</span><span>${escapeHtml(order.contact_no)}</span></div>`
    : '';

  return `
  <div class="slip-page">
    <div class="slip-header">
      <span class="slip-title">ORDER SLIP</span>
      <span class="copy-label">${escapeHtml(copyLabel)}</span>
    </div>
    <div class="slip-meta">
      <div class="meta-row"><span class="meta-key">Order #:</span><span>${order.order_id}</span></div>
      <div class="meta-row"><span class="meta-key">Customer:</span><span>${escapeHtml(order.customer_name || `Customer #${order.customer_id}`)}</span></div>
      ${addressRow}
      ${contactRow}
      <div class="meta-row"><span class="meta-key">Order Date:</span><span>${escapeHtml(formatDateOnly(order.order_date))}</span></div>
      <div class="meta-row"><span class="meta-key">Delivery Date:</span><span>${escapeHtml(formatDateOnly(order.delivery_date))}</span></div>
      <div class="meta-row"><span class="meta-key">Status:</span><span>${statusLabel}</span></div>
    </div>
    <table class="items-table">
      <thead>
        <tr>
          <th class="tc" style="width:6%">#</th>
          <th style="width:46%">Product</th>
          <th class="tc" style="width:8%">Qty</th>
          <th class="tr" style="width:20%">Price</th>
          <th class="tr" style="width:20%">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        ${emptyRows}
      </tbody>
    </table>
    ${totalRow}
    <div class="slip-footer">
      <div class="qr-wrap">
        <img class="qr-img" src="${qrDataUrl}" alt="Order #${order.order_id} QR" />
        <span class="qr-label">Scan to look up Order #${order.order_id}</span>
      </div>
      <span class="page-label">Page ${pageNum} of ${totalPages}</span>
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
          idx * ITEMS_PER_PAGE,
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
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      background: #fff;
      color: #000;
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
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #000;
      padding-bottom: 1.5mm;
      margin-bottom: 1.5mm;
    }
    .slip-title {
      font-size: 10.5pt;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .copy-label {
      font-size: 7.5pt;
      font-weight: bold;
      border: 1px solid #000;
      padding: 0.5mm 2mm;
      letter-spacing: 1px;
    }

    /* ── Meta info ── */
    .slip-meta {
      margin-bottom: 1.5mm;
    }
    .meta-row {
      display: flex;
      font-size: 7.5pt;
      line-height: 1.45;
      gap: 1.5mm;
    }
    .meta-key {
      font-weight: bold;
      min-width: 23mm;
      flex-shrink: 0;
    }

    /* ── Items table ── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      flex: 1;
      margin-bottom: 1.5mm;
      table-layout: fixed;
    }
    .items-table th,
    .items-table td {
      border: 0.5px solid #888;
      padding: 0.6mm 1.2mm;
      font-size: 7.5pt;
      line-height: 1.35;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .items-table th {
      background: #efefef;
      font-weight: bold;
    }
    .items-table .empty-row td {
      border-color: #ddd;
    }
    .td-product {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tc { text-align: center; }
    .tr { text-align: right; }

    /* ── Total ── */
    .slip-total {
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 1mm 1.2mm;
      margin-bottom: 1.5mm;
    }

    /* ── Footer ── */
    .slip-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: auto;
      padding-top: 1mm;
      border-top: 0.5px solid #aaa;
    }
    .qr-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5mm;
    }
    .qr-img {
      width: 20mm;
      height: 20mm;
    }
    .qr-label {
      font-size: 5.5pt;
      color: #555;
      text-align: center;
    }
    .page-label {
      font-size: 7pt;
      color: #444;
      align-self: flex-end;
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
