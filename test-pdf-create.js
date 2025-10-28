const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

async function createTestPdf() {
  const pdfDoc = await PDFDocument.create();

  // Create a simple form with text fields
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const form = pdfDoc.getForm();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Title
  page.drawText('Test PDF Form', {
    x: 50,
    y: 800,
    size: 24,
    font: helvetica,
    color: rgb(0, 0, 0),
  });

  // Create text fields
  const firstNameField = form.createTextField('firstName');
  firstNameField.addToPage(page, { x: 50, y: 700, width: 200, height: 30 });
  firstNameField.setText('');
  firstNameField.enableReadOnly(false);

  const lastNameField = form.createTextField('lastName');
  lastNameField.addToPage(page, { x: 50, y: 650, width: 200, height: 30 });
  lastNameField.setText('');
  lastNameField.enableReadOnly(false);

  const emailField = form.createTextField('email');
  emailField.addToPage(page, { x: 50, y: 600, width: 300, height: 30 });
  emailField.setText('');
  emailField.enableReadOnly(false);

  // Labels
  page.drawText('First Name:', { x: 50, y: 735, size: 12, font: helvetica });
  page.drawText('Last Name:', { x: 50, y: 685, size: 12, font: helvetica });
  page.drawText('Email:', { x: 50, y: 635, size: 12, font: helvetica });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test-form.pdf', pdfBytes);
  console.log('✅ Test PDF created: test-form.pdf');
}

createTestPdf().catch(console.error);
