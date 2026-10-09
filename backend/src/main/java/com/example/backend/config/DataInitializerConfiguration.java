package com.example.backend.config;

import com.example.backend.domain.ComplaintStatus;
import com.example.backend.domain.Payment;
import com.example.backend.domain.PaymentStatus;
import com.example.backend.domain.Role;
import com.example.backend.domain.Room;
import com.example.backend.domain.Student;
import com.example.backend.domain.StudentComplaint;
import com.example.backend.domain.StudentNotification;
import com.example.backend.domain.StudentStatus;
import com.example.backend.domain.UserAccount;
import com.example.backend.repository.PaymentRepository;
import com.example.backend.repository.RoomRepository;
import com.example.backend.repository.StudentComplaintRepository;
import com.example.backend.repository.StudentNotificationRepository;
import com.example.backend.repository.StudentRepository;
import com.example.backend.repository.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Configuration
public class DataInitializerConfiguration {
    private static final Logger log = LoggerFactory.getLogger(DataInitializerConfiguration.class);

    @Bean
    @Order(10)
    ApplicationRunner seedHostelData(RoomRepository rooms,
                                     StudentRepository students,
                                     UserAccountRepository users,
                                     StudentNotificationRepository notifications,
                                     StudentComplaintRepository complaints,
                                     PaymentRepository payments) {
        return args -> {
            // 1. Seed Rooms if empty
            if (rooms.count() == 0) {
                log.info("Seeding initial hostel rooms with 1-5 sharing tariffs...");
                List<Room> initialRooms = List.of(
                        new Room("101", 1, new BigDecimal("7500.00")),
                        new Room("102", 2, new BigDecimal("7000.00")),
                        new Room("103", 3, new BigDecimal("6500.00")),
                        new Room("104", 4, new BigDecimal("6000.00")),
                        new Room("105", 5, new BigDecimal("5500.00")),
                        new Room("201", 1, new BigDecimal("7500.00")),
                        new Room("202", 2, new BigDecimal("7000.00")),
                        new Room("203", 3, new BigDecimal("6500.00")),
                        new Room("204", 4, new BigDecimal("6000.00")),
                        new Room("205", 5, new BigDecimal("5500.00")),
                        new Room("301", 2, new BigDecimal("7000.00")),
                        new Room("302", 3, new BigDecimal("6500.00")),
                        new Room("303", 4, new BigDecimal("6000.00")),
                        new Room("304", 5, new BigDecimal("5500.00"))
                );
                rooms.saveAll(initialRooms);
                log.info("Successfully seeded 14 hostel rooms across 1st, 2nd, and 3rd floors.");
            }

            // 2. Link existing students to their Room entity if unlinked
            students.findAll().forEach(student -> {
                if (student.getRoom() == null && student.getRoomNumber() != null && !student.getRoomNumber().isBlank()) {
                    rooms.findByRoomNumberIgnoreCase(student.getRoomNumber().trim()).ifPresent(room -> {
                        student.setRoom(room);
                        students.save(student);
                        log.info("Linked student {} to room {}", student.getStudentName(), room.getRoomNumber());
                    });
                }
            });

            // 3. Ensure every STUDENT user account has an active student profile
            users.findAll().stream()
                    .filter(u -> u.getRole() == Role.STUDENT)
                    .forEach(studentAccount -> {
                        if (students.findByAccountId(studentAccount.getId()).isEmpty()
                                && students.findByEmailIgnoreCase(studentAccount.getEmail()).isEmpty()) {
                            log.info("Creating default student profile for registered user {}", studentAccount.getEmail());
                            String name = studentAccount.getEmail().split("@")[0];
                            String studentName = Character.toUpperCase(name.charAt(0)) + name.substring(1);
                            Student student = new Student(studentName, studentAccount.getEmail());
                            student.setAccount(studentAccount);
                            student.setStatus(StudentStatus.ACTIVE);
                            student.updateProfile(
                                    studentName,
                                    studentAccount.getEmail(),
                                    "103",
                                    "3 Sharing",
                                    "Hostel Engineering College",
                                    "B.Tech 3rd Year",
                                    "+91 98765 12345",
                                    "+91 98765 67890",
                                    "Heaven Boys Hostel, Main Campus",
                                    new BigDecimal("6500.00"),
                                    LocalDate.now().minusMonths(2)
                            );
                            rooms.findByRoomNumberIgnoreCase("103").ifPresent(student::setRoom);
                            students.save(student);
                        }
                    });

            // 4. Seed initial notifications for student accounts if empty
            students.findAll().forEach(student -> {
                if (student.getAccount() != null) {
                    Long accId = student.getAccount().getId();
                    if (notifications.findByStudentAccountIdOrderByCreatedAtDesc(accId).isEmpty()) {
                        notifications.save(new StudentNotification(student,
                                "Welcome to Heaven Hostels!",
                                "Your room allotment and hostel credentials are confirmed. High-speed Wi-Fi (SSID: HeavenHostel_5G) and 24/7 security amenities are active."));
                        notifications.save(new StudentNotification(student,
                                "Mess Dining Schedule Reminder",
                                "Breakfast (7:30 - 9:30 AM), Lunch (12:30 - 2:30 PM), Snacks (5:00 - 6:30 PM), Dinner (7:30 - 9:30 PM). View complete daily menus in the Mess Menu tab."));
                        notifications.save(new StudentNotification(student,
                                "Hostel Fee Tariffs & Payment Info",
                                "Official fee structure: 1 Sharing ₹7,500, 2 Sharing ₹7,000, 3 Sharing ₹6,500, 4 Sharing ₹6,000, 5 Sharing ₹5,500. Track dues and receipts anytime in Fee Management."));
                        log.info("Seeded initial notifications for student {}", student.getStudentName());
                    }
                }
            });

            // 5. Seed sample complaint if none exist
            if (complaints.count() == 0 && students.count() > 0) {
                Student sampleStudent = students.findAll().getFirst();
                StudentComplaint complaint = new StudentComplaint(sampleStudent,
                        "Maintenance: Study desk reading lamp & socket check",
                        "Hostel maintenance completed the reading light installation and verified room power outlets.");
                complaint.setStatus(ComplaintStatus.RESOLVED);
                complaints.save(complaint);
                log.info("Seeded sample resolved complaint.");
            }

            // 6. Seed past month payment if none exist
            if (payments.count() == 0 && students.count() > 0) {
                LocalDate today = LocalDate.now();
                LocalDate prevMonthDate = today.minusMonths(1);
                students.findAll().forEach(st -> {
                    BigDecimal amt = st.getAmountPerMonth() != null ? st.getAmountPerMonth() : new BigDecimal("6500.00");
                    String recNum = "REC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                    String txnId = "TXN-INIT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                    Payment pastPayment = new Payment(
                            st,
                            amt,
                            prevMonthDate.getMonthValue(),
                            prevMonthDate.getYear(),
                            prevMonthDate,
                            PaymentStatus.PAID,
                            recNum,
                            txnId
                    );
                    payments.save(pastPayment);
                    log.info("Seeded previous month paid record for student {}", st.getStudentName());
                });
            }
        };
    }
}
