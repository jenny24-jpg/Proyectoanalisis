import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IOrdenCompraCompleta } from '@erp/contracts';
import { formatCurrency, formatDate } from '../../../utils/formatters';

/**
 * Genera y descarga de forma inmediata un documento PDF profesional
 * y estandarizado para la Orden de Compra oficial (PO).
 */
export const generarOrdenCompraPdf = (ordenCompra: IOrdenCompraCompleta): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Paleta de Colores Corporativos ERP
  const COLOR_PRIMARY_BLUE = [30, 64, 175]; // #1E40AF
  const COLOR_DARK_SLATE = [15, 23, 42]; // #0F172A
  const COLOR_TEXT_SLATE = [51, 65, 85]; // #334155
  const COLOR_MUTED_SLATE = [100, 116, 139]; // #64748B
  const COLOR_LIGHT_BG = [248, 250, 252]; // #F8FAFC
  const COLOR_BORDER_SLATE = [226, 232, 240]; // #E2E8F0
  const COLOR_EMERALD = [5, 150, 105]; // #059669

  let currentY = margin;

  // ==========================================
  // 1. CABECERA CORPORATIVA Y CAJA DE PO
  // ==========================================

  // Logo Badge ERP
  doc.setFillColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.roundedRect(margin, currentY, 10, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ERP', margin + 5, currentY + 6.5, { align: 'center' });

  // Nombre de Empresa
  doc.setTextColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('EMPRESA CORPORATIVA S.A.', margin + 13, currentY + 4.5);

  // Subtítulo
  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('MÓDULO DE COMPRAS & ADQUISICIONES', margin + 13, currentY + 8.5);

  // Datos Institucionales de la Empresa
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('NIT: 8934521-0  |  PBX: +(502) 2200-0000  |  Ciudad de Guatemala, Guatemala', margin, currentY + 14);
  doc.text('Dirección: Calzada Principal 12-45, Zona 10, Edificio Corporativo', margin, currentY + 17.5);

  // Caja de Orden de Compra (Derecha)
  const poBoxWidth = 62;
  const poBoxHeight = 22;
  const poBoxX = pageWidth - margin - poBoxWidth;
  const poBoxY = currentY;

  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.setDrawColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(poBoxX, poBoxY, poBoxWidth, poBoxHeight, 2, 2, 'FD');

  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('ORDEN DE COMPRA OFICIAL', poBoxX + poBoxWidth / 2, poBoxY + 4.5, { align: 'center' });

  doc.setTextColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(ordenCompra.ocoNoPo, poBoxX + poBoxWidth / 2, poBoxY + 10, { align: 'center' });

  // Línea divisoria en la caja de PO
  doc.setDrawColor(COLOR_BORDER_SLATE[0], COLOR_BORDER_SLATE[1], COLOR_BORDER_SLATE[2]);
  doc.setLineWidth(0.2);
  doc.line(poBoxX + 3, poBoxY + 12, poBoxX + poBoxWidth - 3, poBoxY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLOR_TEXT_SLATE[0], COLOR_TEXT_SLATE[1], COLOR_TEXT_SLATE[2]);
  doc.text(`Emisión: ${formatDate(ordenCompra.ocoFechaEmision)}`, poBoxX + 4, poBoxY + 16);

  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(ordenCompra.estNombreEstado || 'AUTORIZADA', poBoxX + poBoxWidth - 4, poBoxY + 16, { align: 'right' });

  // Separador horizontal principal
  currentY += 22;
  doc.setDrawColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.setLineWidth(0.6);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 4;

  // ==========================================
  // 2. BLOQUES DE INFORMACIÓN (PROVEEDOR Y ENTREGA)
  // ==========================================
  const cardWidth = (contentWidth - 4) / 2;
  const cardHeight = 27;

  // Card 1: Proveedor Adjudicado
  const card1X = margin;
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.setDrawColor(COLOR_BORDER_SLATE[0], COLOR_BORDER_SLATE[1], COLOR_BORDER_SLATE[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(card1X, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DATOS DEL PROVEEDOR ADJUDICADO', card1X + 3.5, currentY + 4.5);

  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Razón Social:', card1X + 3.5, currentY + 10);
  doc.text('NIT:', card1X + 3.5, currentY + 15);
  doc.text('Condición de Pago:', card1X + 3.5, currentY + 20);
  doc.text('Tiempo de Entrega:', card1X + 3.5, currentY + 24.5);

  doc.setTextColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.setFont('helvetica', 'bold');
  const nombreProv = (ordenCompra.proNombreEntidad || 'Proveedor Adjudicado').substring(0, 32);
  doc.text(nombreProv, card1X + cardWidth - 3.5, currentY + 10, { align: 'right' });

  doc.setFont('courier', 'bold');
  doc.text(ordenCompra.proNit || 'C/F', card1X + cardWidth - 3.5, currentY + 15, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  const plazoPago = ordenCompra.cotCondicionPagoDias
    ? `${ordenCompra.cotCondicionPagoDias} días crédito`
    : 'Contado / Crédito';
  doc.text(plazoPago, card1X + cardWidth - 3.5, currentY + 20, { align: 'right' });

  const tiempoEntrega = ordenCompra.cotTiempoEntregaDias
    ? `${ordenCompra.cotTiempoEntregaDias} días hábiles`
    : 'Inmediata';
  doc.text(tiempoEntrega, card1X + cardWidth - 3.5, currentY + 24.5, { align: 'right' });

  // Card 2: Entrega y Solicitud
  const card2X = margin + cardWidth + 4;
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.setDrawColor(COLOR_BORDER_SLATE[0], COLOR_BORDER_SLATE[1], COLOR_BORDER_SLATE[2]);
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DATOS DE ENTREGA Y FACTURACIÓN', card2X + 3.5, currentY + 4.5);

  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Solicitud Origen:', card2X + 3.5, currentY + 10);
  doc.text('Departamento:', card2X + 3.5, currentY + 15);
  doc.text('Lugar de Entrega:', card2X + 3.5, currentY + 20);
  doc.text('Moneda Oficial:', card2X + 3.5, currentY + 24.5);

  doc.setTextColor(COLOR_PRIMARY_BLUE[0], COLOR_PRIMARY_BLUE[1], COLOR_PRIMARY_BLUE[2]);
  doc.setFont('courier', 'bold');
  doc.text(ordenCompra.solNoDocumento || 'SOL-ORIGINAL', card2X + cardWidth - 3.5, currentY + 10, { align: 'right' });

  doc.setTextColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.setFont('helvetica', 'bold');
  const deptoNombre = (ordenCompra.depNombreDepartamento || 'Departamento General').substring(0, 30);
  doc.text(deptoNombre, card2X + cardWidth - 3.5, currentY + 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text('Bodega Central de Almacén', card2X + cardWidth - 3.5, currentY + 20, { align: 'right' });
  doc.text('Quetzales (GTQ - Q)', card2X + cardWidth - 3.5, currentY + 24.5, { align: 'right' });

  currentY += cardHeight + 4;

  // ==========================================
  // 3. TABLA DE ÍTEMS / LÍNEAS DE ORDEN DE COMPRA
  // ==========================================
  doc.setTextColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DETALLE DE ARTÍCULOS Y SUMINISTROS AUTORIZADOS', margin, currentY + 2);

  currentY += 4;

  const tableBody = (ordenCompra.detalles || []).map((det, index) => [
    String(index + 1),
    det.docCodigoArticulo,
    det.artDescripcion || det.docCodigoArticulo,
    det.umeNombreUnidad || 'UN',
    String(det.docCantidadPedida),
    formatCurrency(det.docPrecioUnitario),
    formatCurrency(det.docTotalLinea),
  ]);

  if (tableBody.length === 0) {
    tableBody.push(['1', 'ART-0001', 'Artículo Autorizado', 'UN', '1', formatCurrency(ordenCompra.ocoSubtotal), formatCurrency(ordenCompra.ocoSubtotal)]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'CÓDIGO', 'DESCRIPCIÓN DEL ARTÍCULO', 'U.M.', 'CANTIDAD', 'PRECIO UNIT.', 'TOTAL LÍNEA']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2.2,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]],
      lineColor: [COLOR_BORDER_SLATE[0], COLOR_BORDER_SLATE[1], COLOR_BORDER_SLATE[2]],
      lineWidth: 0.15,
    },
    alternateRowStyles: {
      fillColor: [COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { halign: 'left', font: 'courier', fontStyle: 'bold', cellWidth: 26 },
      2: { halign: 'left' },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
      5: { halign: 'right', font: 'courier', cellWidth: 26 },
      6: { halign: 'right', font: 'courier', fontStyle: 'bold', cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 30;
  currentY = finalY + 4;

  // ==========================================
  // 4. CONDICIONES Y CUADRO DE TOTALES
  // ==========================================
  const totalsBoxWidth = 68;
  const conditionsWidth = contentWidth - totalsBoxWidth - 4;
  const totalsBoxHeight = 24;

  // Cuadro de Condiciones Generales (Izquierda)
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.setDrawColor(COLOR_BORDER_SLATE[0], COLOR_BORDER_SLATE[1], COLOR_BORDER_SLATE[2]);
  doc.roundedRect(margin, currentY, conditionsWidth, totalsBoxHeight, 2, 2, 'FD');

  doc.setTextColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Condiciones Generales de Entrega y Facturación:', margin + 3.5, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLOR_TEXT_SLATE[0], COLOR_TEXT_SLATE[1], COLOR_TEXT_SLATE[2]);
  doc.text('1. Adjuntar copia física de esta Orden de Compra oficial al entregar en Bodega Central.', margin + 3.5, currentY + 9.5);
  doc.text('2. La factura contable debe ser emitida a nombre de la empresa con el NIT oficial.', margin + 3.5, currentY + 14);
  doc.text('3. Todo despacho está sujeto a inspección física y cotejo 3-Way Match antes del pago.', margin + 3.5, currentY + 18.5);

  // Cuadro de Totales (Derecha)
  const totalsBoxX = margin + conditionsWidth + 4;
  doc.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  doc.setDrawColor(COLOR_BORDER_SLATE[0], COLOR_BORDER_SLATE[1], COLOR_BORDER_SLATE[2]);
  doc.roundedRect(totalsBoxX, currentY, totalsBoxWidth, totalsBoxHeight, 2, 2, 'FD');

  const subtotal = Number(ordenCompra.ocoSubtotal || 0);
  const iva = Number(ordenCompra.ocoMontoIva || 0);
  const total = Number(ordenCompra.ocoTotal || 0);

  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal Neto:', totalsBoxX + 3.5, currentY + 5.5);
  doc.text('IVA (12%):', totalsBoxX + 3.5, currentY + 11);

  doc.setFont('courier', 'bold');
  doc.setTextColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.text(formatCurrency(subtotal), totalsBoxX + totalsBoxWidth - 3.5, currentY + 5.5, { align: 'right' });
  doc.text(formatCurrency(iva), totalsBoxX + totalsBoxWidth - 3.5, currentY + 11, { align: 'right' });

  // Banner Total Destacado
  doc.setFillColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.roundedRect(totalsBoxX + 1.5, currentY + 14.5, totalsBoxWidth - 3, 8, 1.5, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('TOTAL ORDEN:', totalsBoxX + 4.5, currentY + 19.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text(formatCurrency(total), totalsBoxX + totalsBoxWidth - 4.5, currentY + 19.5, { align: 'right' });

  currentY += totalsBoxHeight + 8;

  // ==========================================
  // 5. SECCIÓN DE FIRMAS OFICIALES
  // ==========================================
  if (currentY > pageHeight - 38) {
    doc.addPage();
    currentY = margin + 5;
  }

  const signWidth = (contentWidth - 10) / 3;
  const signHeight = 20;

  // Firma 1: Solicitante
  const sign1X = margin;
  doc.setDrawColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.setLineWidth(0.3);
  doc.line(sign1X + 4, currentY + 12, sign1X + signWidth - 4, currentY + 12);
  doc.setTextColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Solicitante', sign1X + signWidth / 2, currentY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('Unidad Requirente', sign1X + signWidth / 2, currentY + 19, { align: 'center' });

  // Firma 2: Gerencia / Presupuesto
  const sign2X = margin + signWidth + 5;
  doc.setDrawColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.line(sign2X + 4, currentY + 12, sign2X + signWidth - 4, currentY + 12);
  doc.setTextColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Gerencia / Presupuesto', sign2X + signWidth / 2, currentY + 16, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(COLOR_EMERALD[0], COLOR_EMERALD[1], COLOR_EMERALD[2]);
  doc.text('✓ Autorizado en ERP', sign2X + signWidth / 2, currentY + 19, { align: 'center' });

  // Firma 3: Aceptación Proveedor
  const sign3X = margin + (signWidth + 5) * 2;
  doc.setDrawColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.line(sign3X + 4, currentY + 12, sign3X + signWidth - 4, currentY + 12);
  doc.setTextColor(COLOR_DARK_SLATE[0], COLOR_DARK_SLATE[1], COLOR_DARK_SLATE[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Aceptación Proveedor', sign3X + signWidth / 2, currentY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('Firma y Sello', sign3X + signWidth / 2, currentY + 19, { align: 'center' });

  // ==========================================
  // 6. PIE DE PÁGINA Y TRAZABILIDAD
  // ==========================================
  const footerY = pageHeight - 8;
  doc.setDrawColor(COLOR_BORDER_SLATE[0], COLOR_BORDER_SLATE[1], COLOR_BORDER_SLATE[2]);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 2.5, pageWidth - margin, footerY - 2.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(COLOR_MUTED_SLATE[0], COLOR_MUTED_SLATE[1], COLOR_MUTED_SLATE[2]);
  doc.text('ERP Sistema de Compras - Documento Oficial Emitido', margin, footerY);
  doc.text(`REF: ${ordenCompra.ocoNoPo} | SOL: ${ordenCompra.solNoDocumento}`, pageWidth / 2, footerY, { align: 'center' });
  doc.text('Página 1 de 1', pageWidth - margin, footerY, { align: 'right' });

  // Disparar la descarga directa del archivo PDF
  const filename = `Orden_Compra_${ordenCompra.ocoNoPo}.pdf`;
  doc.save(filename);
};
