package com.example.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "students", uniqueConstraints = @UniqueConstraint(name = "uk_student_email", columnNames = "email"))
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_name", nullable = false, length = 120)
    private String studentName;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(name = "room_number", length = 30)
    private String roomNumber;

    @Column(length = 10)
    private String sharing;

    @Column(name = "college_name", length = 180)
    private String collegeName;

    @Column(name = "course_name_and_year", length = 120)
    private String courseNameAndYear;

    @Column(name = "mobile_number", length = 30)
    private String mobileNumber;

    @Column(name = "parent_mobile_number", length = 30)
    private String parentMobileNumber;

    @Column(length = 500)
    private String address;

    @Column(name = "amount_per_month", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountPerMonth = BigDecimal.ZERO;

    @Column(name = "starting_date")
    private LocalDate startingDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StudentStatus status = StudentStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", unique = true)
    private UserAccount account;

    @OneToMany(mappedBy = "student")
    private List<Payment> payments = new ArrayList<>();

    protected Student() {
    }

    public Student(String studentName, String email) {
        this.studentName = studentName;
        this.email = email;
    }

    public Long getId() { return id; }
    public String getStudentName() { return studentName; }
    public String getEmail() { return email; }
    public String getRoomNumber() { return roomNumber; }
    public String getSharing() { return sharing; }
    public String getCollegeName() { return collegeName; }
    public String getCourseNameAndYear() { return courseNameAndYear; }
    public String getMobileNumber() { return mobileNumber; }
    public String getParentMobileNumber() { return parentMobileNumber; }
    public String getAddress() { return address; }
    public BigDecimal getAmountPerMonth() { return amountPerMonth; }
    public LocalDate getStartingDate() { return startingDate; }
    public StudentStatus getStatus() { return status; }
    public Room getRoom() { return room; }
    public UserAccount getAccount() { return account; }
    public List<Payment> getPayments() { return payments; }
    public boolean isActive() { return status == StudentStatus.ACTIVE; }
    public void setAccount(UserAccount account) { this.account = account; }
    public void setRoom(Room room) { this.room = room; this.roomNumber = room == null ? null : room.getRoomNumber(); }
    public void setStatus(StudentStatus status) { this.status = status; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public void updateProfile(String studentName, String email, String roomNumber, String sharing,
                              String collegeName, String courseNameAndYear, String mobileNumber,
                              String parentMobileNumber, String address, BigDecimal amountPerMonth,
                              LocalDate startingDate) {
        this.studentName = studentName;
        this.email = email;
        this.roomNumber = roomNumber;
        this.sharing = sharing;
        this.collegeName = collegeName;
        this.courseNameAndYear = courseNameAndYear;
        this.mobileNumber = mobileNumber;
        this.parentMobileNumber = parentMobileNumber;
        this.address = address;
        this.amountPerMonth = amountPerMonth;
        this.startingDate = startingDate;
    }
}
