package com.example.backend.service;

import com.example.backend.api.dto.ApiDtos.PageResponse;
import com.example.backend.api.dto.ApiDtos.StudentRequest;
import com.example.backend.api.dto.ApiDtos.StudentResponse;
import com.example.backend.domain.Payment;
import com.example.backend.domain.PaymentStatus;
import com.example.backend.domain.Room;
import com.example.backend.domain.Student;
import com.example.backend.domain.StudentStatus;
import com.example.backend.domain.UserAccount;
import com.example.backend.repository.PaymentRepository;
import com.example.backend.repository.RoomRepository;
import com.example.backend.repository.StudentRepository;
import com.example.backend.repository.UserAccountRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class StudentService {
    private final StudentRepository students;
    private final UserAccountRepository users;
    private final RoomRepository rooms;
    private final PaymentRepository payments;
    private final AuditService audit;

    public StudentService(StudentRepository students, UserAccountRepository users, RoomRepository rooms,
                          PaymentRepository payments, AuditService audit) {
        this.students = students;
        this.users = users;
        this.rooms = rooms;
        this.payments = payments;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public PageResponse<StudentResponse> list(int page, int size) {
        Page<Student> result = students.findAll(PageRequest.of(page, size));
        return new PageResponse<>(result.getContent().stream().map(this::view).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> all() {
        return students.findAllByOrderByStudentNameAsc().stream().map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public StudentResponse get(Long id) {
        return view(findStudent(id));
    }

    @Transactional(readOnly = true)
    public StudentResponse byEmail(String email) {
        return students.findByEmailIgnoreCase(email.trim())
                .map(this::view).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<String> roommateNames(Long accountId) {
        Student student = students.findByAccountId(accountId)
                .orElseThrow(() -> ApiException.notFound("Student profile not found"));
        if (student.getRoom() == null) return List.of();
        return students.findByRoomIdAndIdNotOrderByStudentNameAsc(student.getRoom().getId(), student.getId())
                .stream().map(Student::getStudentName).toList();
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> byRoom(String roomNumber) {
        return students.findByRoomNumberOrderByStudentNameAsc(roomNumber.trim()).stream().map(this::view).toList();
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> search(String query) {
        String normalized = query.trim().toLowerCase(Locale.ROOT);
        return students.findAllByOrderByStudentNameAsc().stream()
                .filter(student -> contains(student.getStudentName(), normalized)
                        || contains(student.getEmail(), normalized)
                        || contains(student.getRoomNumber(), normalized)
                        || contains(student.getMobileNumber(), normalized))
                .map(this::view).toList();
    }

    @Transactional
    public StudentResponse saveProfile(StudentRequest request, UserAccount actor, boolean admin) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        Student student;
        if (admin) {
            student = students.findByEmailIgnoreCaseForUpdate(email).orElseGet(() -> {
                Student created = new Student(request.studentName().trim(), email);
                users.findByEmailIgnoreCase(email).ifPresent(account -> {
                    if (account.getRole() != com.example.backend.domain.Role.STUDENT) {
                        throw ApiException.conflict("A student profile cannot use an administrator account");
                    }
                    created.setAccount(account);
                });
                return created;
            });
            if (student.getAccount() != null && student.getAccount().getRole() != com.example.backend.domain.Role.STUDENT) {
                throw ApiException.conflict("A student profile cannot use an administrator account");
            }
        } else {
            student = students.findByAccountIdForUpdate(actor.getId())
                    .orElseThrow(() -> ApiException.notFound("Student profile not found"));
            if (!student.getEmail().equalsIgnoreCase(email)) {
                throw ApiException.forbidden("Students may only update their own profile");
        }
        }

        String roomNumber = admin && request.roomNumber() != null && !request.roomNumber().isBlank()
                ? request.roomNumber().trim() : student.getRoomNumber();
        BigDecimal monthlyRate = request.amountPerMonth() == null
                ? student.getAmountPerMonth() : request.amountPerMonth();
        LocalDate startingDate = request.startingDate() == null
                ? student.getStartingDate() : request.startingDate();
        student.updateProfile(request.studentName().trim(), email, roomNumber,
                request.sharing() == null ? student.getSharing() : request.sharing(),
                request.collegeName() == null ? student.getCollegeName() : request.collegeName(),
                request.courseNameAndYear() == null ? student.getCourseNameAndYear() : request.courseNameAndYear(),
                request.mobileNumber() == null ? student.getMobileNumber() : request.mobileNumber(),
                request.parentMobileNumber() == null ? student.getParentMobileNumber() : request.parentMobileNumber(),
                request.address() == null ? student.getAddress() : request.address(), monthlyRate, startingDate);

        if (admin) {
            if (roomNumber != null && !roomNumber.isBlank()) {
                Room roomSummary = rooms.findByRoomNumberIgnoreCase(roomNumber)
                        .orElseThrow(() -> ApiException.badRequest("Create the room before assigning a student"));
                Room room = rooms.findByIdForUpdate(roomSummary.getId()).orElseThrow(() ->
                        ApiException.notFound("Room not found"));
                if (student.getRoom() == null || !student.getRoom().getId().equals(room.getId())) {
                    if (!room.isActive() || students.countByRoomId(room.getId()) >= room.getCapacity()) {
                        throw ApiException.conflict("Room has no available beds");
                    }
                    student.setRoom(room);
                }
            }
            if (request.active() != null) {
                student.setStatus(request.active() ? StudentStatus.ACTIVE : StudentStatus.INACTIVE);
            } else if (student.getStatus() == StudentStatus.PENDING) {
                student.setStatus(StudentStatus.ACTIVE);
            }
        }
        Student saved = students.save(student);
        if (saved.isActive()) ensureCurrentUnpaid(saved);
        audit.record(actor.getEmail(), admin ? "ADMIN_CREATED_OR_UPDATED_STUDENT" : "STUDENT_PROFILE_UPDATED",
                "Student", saved.getId());
        return view(saved);
    }

    @Transactional
    public StudentResponse saveLegacyProfile(StudentRequest request, UserAccount actor) {
        if (request.roomNumber() != null && !request.roomNumber().isBlank()
                && rooms.findByRoomNumberIgnoreCase(request.roomNumber().trim()).isEmpty()) {
            int capacity;
            try {
                capacity = Integer.parseInt(request.sharing());
            } catch (NumberFormatException exception) {
                throw ApiException.badRequest("Select the room sharing capacity before adding the student");
            }
            if (capacity < 1 || capacity > 5) {
                throw ApiException.badRequest("Room sharing must be between 1 and 5");
            }
            Room room = rooms.save(new Room(request.roomNumber().trim(), capacity,
                    request.amountPerMonth() == null ? BigDecimal.ZERO : request.amountPerMonth()));
            audit.record(actor.getEmail(), "ROOM_CREATED", "Room", room.getId());
        }
        return saveProfile(request, actor, true);
    }

    @Transactional
    public StudentResponse update(Long id, StudentRequest request, UserAccount actor) {
        Student student = students.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("Student not found"));
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (!student.getEmail().equalsIgnoreCase(email)) {
            students.findByEmailIgnoreCase(email)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> { throw ApiException.conflict("Email is already in use"); });
            users.findByEmailIgnoreCase(email)
                    .filter(existing -> student.getAccount() == null || !existing.getId().equals(student.getAccount().getId()))
                    .ifPresent(existing -> { throw ApiException.conflict("Email is already in use"); });
            if (student.getAccount() != null) student.getAccount().setEmail(email);
        }
        String roomNumber = request.roomNumber() == null || request.roomNumber().isBlank()
                ? student.getRoomNumber() : request.roomNumber().trim();
        Room room = student.getRoom();
        if (roomNumber != null && !roomNumber.isBlank()
                && (room == null || !room.getRoomNumber().equalsIgnoreCase(roomNumber))) {
            Room roomSummary = rooms.findByRoomNumberIgnoreCase(roomNumber)
                    .orElseThrow(() -> ApiException.badRequest("Create the room before assigning a student"));
            room = rooms.findByIdForUpdate(roomSummary.getId()).orElseThrow(() ->
                    ApiException.notFound("Room not found"));
            if (!room.isActive() || students.countByRoomId(room.getId()) >= room.getCapacity()) {
                throw ApiException.conflict("Room has no available beds");
            }
        }
        student.updateProfile(request.studentName().trim(), email, roomNumber,
                request.sharing() == null ? student.getSharing() : request.sharing(),
                request.collegeName() == null ? student.getCollegeName() : request.collegeName(),
                request.courseNameAndYear() == null ? student.getCourseNameAndYear() : request.courseNameAndYear(),
                request.mobileNumber() == null ? student.getMobileNumber() : request.mobileNumber(),
                request.parentMobileNumber() == null ? student.getParentMobileNumber() : request.parentMobileNumber(),
                request.address() == null ? student.getAddress() : request.address(),
                request.amountPerMonth() == null ? student.getAmountPerMonth() : request.amountPerMonth(),
                request.startingDate() == null ? student.getStartingDate() : request.startingDate());
        if (room != student.getRoom()) student.setRoom(room);
        if (request.active() != null) {
            student.setStatus(request.active() ? StudentStatus.ACTIVE : StudentStatus.INACTIVE);
        }
        Student saved = students.save(student);
        if (saved.isActive()) ensureCurrentUnpaid(saved);
        audit.record(actor.getEmail(), "ADMIN_UPDATED_STUDENT", "Student", id);
        return view(saved);
    }

    @Transactional
    public void delete(Long id, String actor) {
        Student student = students.findByIdForUpdate(id)
                .orElseThrow(() -> ApiException.notFound("Student not found"));
        student.setRoom(null);
        student.setStatus(StudentStatus.INACTIVE);
        students.save(student);
        audit.record(actor, "ADMIN_DEACTIVATED_STUDENT", "Student", id);
    }

    @Transactional(readOnly = true)
    public Student findStudent(Long id) {
        return students.findById(id).orElseThrow(() -> ApiException.notFound("Student not found"));
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> allViews() {
        return students.findAllByOrderByStudentNameAsc().stream().map(this::view).toList();
    }

    private StudentResponse view(Student student) {
        LocalDate today = LocalDate.now();
        PaymentStatus currentStatus = payments.findByStudentIdAndYearAndMonthAndStatus(
                student.getId(), today.getYear(), today.getMonthValue(), PaymentStatus.PAID).isPresent()
                ? PaymentStatus.PAID : PaymentStatus.UNPAID;
        Long id = student.getId();
        return new StudentResponse(id, id, student.getStudentName(), student.getStudentName(),
                student.getEmail(), student.getEmail(), student.getRoomNumber(), student.getRoomNumber(),
                student.getSharing(), student.getSharing(), student.getCollegeName(), student.getCollegeName(),
                student.getCourseNameAndYear(), student.getCourseNameAndYear(), student.getMobileNumber(),
                student.getMobileNumber(), student.getParentMobileNumber(), student.getParentMobileNumber(),
                student.getAddress(), student.getAmountPerMonth(), student.getAmountPerMonth(),
                student.getStartingDate(), student.getStartingDate(), student.getStatus().name(),
                student.isActive(), currentStatus == PaymentStatus.PAID ? "Paid" : "Unpaid");
    }

    @Transactional(readOnly = true)
    public StudentResponse responseFor(Student student) {
        return view(student);
    }

    private boolean contains(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query);
    }

    private void ensureCurrentUnpaid(Student student) {
        LocalDate today = LocalDate.now();
        if (!payments.existsByStudentIdAndYearAndMonthAndStatus(
                student.getId(), today.getYear(), today.getMonthValue(), PaymentStatus.PAID)
                && !payments.existsByStudentIdAndYearAndMonthAndStatus(
                student.getId(), today.getYear(), today.getMonthValue(), PaymentStatus.UNPAID)) {
            payments.save(new Payment(student, student.getAmountPerMonth(), today.getMonthValue(),
                    today.getYear(), today, PaymentStatus.UNPAID,
                    "DUE-" + UUID.randomUUID().toString().replace("-", "").substring(0, 18).toUpperCase(Locale.ROOT),
                    null));
        }
    }
}
