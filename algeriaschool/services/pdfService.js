const PDFDocument = require('pdfkit');

function streamToBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

async function generateInvoicePdf(invoice, school) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const promise = streamToBuffer(doc);

  doc.fontSize(22).fillColor('#4f46e5').text(school?.name || 'AlgeriaSchool', { align: 'left' });
  doc.fontSize(10).fillColor('#64748b').text(school?.address?.city || 'Alger, Algérie', { align: 'left' });
  doc.moveDown(2);

  doc.fontSize(18).fillColor('#1e293b').text('FACTURE', { align: 'right' });
  doc.fontSize(10).fillColor('#64748b').text(`N°: ${invoice.invoiceNumber}`, { align: 'right' });
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`, { align: 'right' });
  if (invoice.dueDate) doc.text(`Échéance: ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, { align: 'right' });
  doc.moveDown(2);

  doc.fontSize(12).fillColor('#1e293b').text('Facturé à:', { underline: true });
  doc.fontSize(10).fillColor('#475569').text(`${invoice.student?.firstName || ''} ${invoice.student?.lastName || ''}`);
  if (invoice.student?.studentId) doc.text(`ID: ${invoice.student.studentId}`);
  doc.moveDown(2);

  const tableTop = doc.y;
  doc.fontSize(10).fillColor('#1e293b').text('Description', 50, tableTop);
  doc.text('Qté', 350, tableTop, { width: 50, align: 'right' });
  doc.text('Montant', 420, tableTop, { width: 100, align: 'right' });
  doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#e2e8f0').stroke();

  let y = tableTop + 25;
  (invoice.items || []).forEach((item) => {
    doc.fillColor('#475569').text(item.description || '—', 50, y);
    doc.text(String(item.quantity || 1), 350, y, { width: 50, align: 'right' });
    doc.text(`${(item.amount || 0).toLocaleString()} DA`, 420, y, { width: 100, align: 'right' });
    y += 20;
  });

  doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
  y += 15;
  doc.fontSize(10).fillColor('#64748b').text('Sous-total', 350, y, { width: 70, align: 'right' });
  doc.text(`${(invoice.subtotal || invoice.total || 0).toLocaleString()} DA`, 420, y, { width: 100, align: 'right' });
  if (invoice.lateFee) {
    y += 18;
    doc.text('Frais de retard', 350, y, { width: 70, align: 'right' });
    doc.text(`${invoice.lateFee.toLocaleString()} DA`, 420, y, { width: 100, align: 'right' });
  }
  y += 18;
  doc.fontSize(13).fillColor('#1e293b').text('TOTAL', 350, y, { width: 70, align: 'right' });
  doc.fillColor('#4f46e5').text(`${(invoice.total || 0).toLocaleString()} DA`, 420, y, { width: 100, align: 'right' });

  if (invoice.amountPaid > 0) {
    y += 25;
    doc.fontSize(10).fillColor('#059669').text('Payé', 350, y, { width: 70, align: 'right' });
    doc.text(`${invoice.amountPaid.toLocaleString()} DA`, 420, y, { width: 100, align: 'right' });
    y += 18;
    doc.fillColor('#dc2626').text('Solde', 350, y, { width: 70, align: 'right' });
    doc.text(`${(invoice.balance || 0).toLocaleString()} DA`, 420, y, { width: 100, align: 'right' });
  }

  doc.fontSize(8).fillColor('#94a3b8').text('Modes de paiement: CCP · BaridiBank · Virement · Espèces', 50, 750, { align: 'center', width: 495 });
  doc.text('Merci pour votre confiance', 50, 765, { align: 'center', width: 495 });

  doc.end();
  return promise;
}

async function generateReportCard(student, averages, overall, school) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const promise = streamToBuffer(doc);

  doc.fontSize(20).fillColor('#4f46e5').text(school?.name || 'AlgeriaSchool', { align: 'center' });
  doc.fontSize(14).fillColor('#1e293b').text("BULLETIN SCOLAIRE", { align: 'center' });
  doc.moveDown(2);

  doc.fontSize(11).fillColor('#475569');
  doc.text(`Élève: ${student.firstName} ${student.lastName}`, 50);
  if (student.studentId) doc.text(`ID: ${student.studentId}`);
  if (student.currentClass?.name) doc.text(`Classe: ${student.currentClass.name}`);
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`);
  doc.moveDown(2);

  const tableTop = doc.y;
  doc.fontSize(11).fillColor('#1e293b').text('Matière', 50, tableTop, { underline: true });
  doc.text('Moyenne /20', 400, tableTop, { underline: true, width: 100, align: 'right' });
  doc.moveTo(50, tableTop + 18).lineTo(545, tableTop + 18).strokeColor('#e2e8f0').stroke();

  let y = tableTop + 28;
  (averages || []).forEach((a) => {
    doc.fontSize(10).fillColor('#475569').text(a.course?.name || '—', 50, y);
    const avgColor = a.average >= 10 ? '#059669' : '#dc2626';
    doc.fillColor(avgColor).text(`${a.average.toFixed(2)} / 20`, 400, y, { width: 100, align: 'right' });
    y += 22;
  });

  y += 10;
  doc.moveTo(50, y).lineTo(545, y).stroke();
  y += 15;
  doc.fontSize(13).fillColor('#1e293b').text('MOYENNE GÉNÉRALE', 50, y);
  const overallColor = overall >= 10 ? '#059669' : '#dc2626';
  doc.fillColor(overallColor).text(`${overall.toFixed(2)} / 20`, 400, y, { width: 100, align: 'right' });

  doc.fontSize(9).fillColor('#94a3b8').text('Document généré automatiquement par AlgeriaSchool', 50, 770, { align: 'center', width: 495 });

  doc.end();
  return promise;
}

async function generateStudentIdCard(student, school) {
  const doc = new PDFDocument({ size: [350, 220], margin: 0 });
  const promise = streamToBuffer(doc);

  doc.rect(0, 0, 350, 220).fill('#ffffff');
  doc.rect(0, 0, 350, 50).fill('#4f46e5');
  doc.fontSize(14).fillColor('#ffffff').text(school?.name || 'AlgeriaSchool', 15, 18);
  doc.fontSize(9).text('Carte d\'identité scolaire', 15, 35);

  doc.rect(15, 65, 80, 100).fill('#e2e8f0').stroke('#cbd5e1');
  doc.fontSize(8).fillColor('#64748b').text('PHOTO', 35, 110);

  doc.fontSize(13).fillColor('#1e293b').text(`${student.firstName} ${student.lastName}`, 110, 70);
  doc.fontSize(8).fillColor('#64748b').text(`ID: ${student.studentId || student._id}`, 110, 90);
  if (student.currentClass?.name) doc.text(`Classe: ${student.currentClass.name}`, 110, 105);
  if (student.dateOfBirth) doc.text(`Né(e) le: ${new Date(student.dateOfBirth).toLocaleDateString('fr-FR')}`, 110, 120);
  doc.text(`Année: ${school?.settings?.academicYear || ''}`, 110, 135);

  doc.rect(0, 185, 350, 35).fill('#f8fafc');
  doc.fontSize(7).fillColor('#94a3b8').text('Cette carte est la propriété de l\'établissement', 15, 195);
  doc.text(`Délivrée le ${new Date().toLocaleDateString('fr-FR')}`, 15, 205);

  doc.end();
  return promise;
}

async function generateCertificate(user, training, school) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
  const promise = streamToBuffer(doc);

  doc.rect(20, 20, 802, 555).strokeColor('#4f46e5').lineWidth(3).stroke();
  doc.rect(35, 35, 772, 525).strokeColor('#06b6d4').lineWidth(1).stroke();

  doc.fontSize(32).fillColor('#4f46e5').text('CERTIFICAT', 0, 80, { align: 'center', width: 842 });
  doc.fontSize(14).fillColor('#64748b').text('de Réussite', 0, 125, { align: 'center', width: 842 });

  doc.fontSize(12).fillColor('#475569').text('Ce certificat est décerné à', 0, 200, { align: 'center', width: 842 });
  doc.fontSize(28).fillColor('#1e293b').text(`${user.firstName} ${user.lastName}`, 0, 230, { align: 'center', width: 842 });

  doc.fontSize(12).fillColor('#475569').text('pour avoir suivi avec succès la formation', 0, 290, { align: 'center', width: 842 });
  doc.fontSize(20).fillColor('#4f46e5').text(training.name || '', 0, 320, { align: 'center', width: 842 });

  doc.fontSize(10).fillColor('#94a3b8').text(`Délivré par ${school?.name || 'AlgeriaSchool'} le ${new Date().toLocaleDateString('fr-FR')}`, 0, 480, { align: 'center', width: 842 });

  doc.end();
  return promise;
}

module.exports = { generateInvoicePdf, generateReportCard, generateStudentIdCard, generateCertificate };
