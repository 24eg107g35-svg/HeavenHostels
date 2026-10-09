package com.example.backend.service;

import com.example.backend.domain.Payment;
import com.example.backend.domain.Student;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.Month;
import java.util.Locale;

@Service
public class ReceiptService {
    private static final Logger log = LoggerFactory.getLogger(ReceiptService.class);
    private final String currency;

    public ReceiptService(@Value("${app.receipt.currency}") String currency) {
        this.currency = currency;
    }

    public byte[] generate(Payment payment) {
        Student student = payment.getStudent();
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, output);
            document.open();
            document.add(new Paragraph("HOSTEL PAYMENT RECEIPT"));
            document.add(new Paragraph("Receipt number: " + payment.getReceiptNumber()));
            document.add(new Paragraph("Payment status: " + payment.getStatus().name()));
            document.add(new Paragraph(" "));
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            addRow(table, "Student", student.getStudentName());
            addRow(table, "Student email", student.getEmail());
            addRow(table, "Room", student.getRoomNumber() == null ? "Not assigned" : student.getRoomNumber());
            addRow(table, "Month", Month.of(payment.getMonth()).getDisplayName(
                    java.time.format.TextStyle.FULL, Locale.ENGLISH) + " " + payment.getYear());
            addRow(table, "Payment date", payment.getDate().toString());
            addRow(table, "Amount", currency + " " + payment.getAmount().toPlainString());
            addRow(table, "Transaction ID", payment.getTransactionId() == null ? "N/A" : payment.getTransactionId());
            document.add(table);
            document.close();
            return output.toByteArray();
        } catch (DocumentException | java.io.IOException exception) {
            log.error("Receipt PDF generation failed for receipt {}", payment.getReceiptNumber(), exception);
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to generate payment receipt");
        }
    }

    private void addRow(PdfPTable table, String label, String value) {
        table.addCell(new Phrase(label));
        table.addCell(new Phrase(value));
    }
}
