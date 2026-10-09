package com.example.backend.api.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.List;

public final class ApiDtos {
    private ApiDtos() {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank @Size(max = 72) String password) {}
    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, max = 72) String password,
            @JsonAlias({"StudentName"}) @NotBlank @Size(max = 120) String studentName,
            @JsonAlias({"StudentRoomNumber"}) 
            String studentRoomNumber,
            @JsonAlias({"Role"}) String role) {}
    public record AuthResponse(String token, String refreshToken, String tokenType, String role, String email) {}
    public record OtpRequest(@NotBlank @Email String email) {}
    public record VerifyOtpRequest(@NotBlank @Email String email, @NotBlank @Size(min = 4, max = 10) String otp) {}
    public record ResetPasswordRequest(@NotBlank @Email String email, @NotBlank @Size(min = 6, max = 72) String password) {}
    public record RefreshRequest(@NotBlank String refreshToken) {}
    public record RoomRequest(
            @NotBlank @Size(max = 30) String roomNumber,
            @Min(1) @Max(100) int capacity,
            @NotNull @DecimalMin(value = "0.00") BigDecimal monthlyRate,
            Boolean active) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StudentRequest(
            @JsonAlias({"StudentName"}) @NotBlank @Size(max = 120) String studentName,
            @JsonAlias({"Email", "email"}) @NotBlank @Email @Size(max = 254) String email,
            @JsonAlias({"RoomNumber", "StudentRoomNumber"}) @Size(max = 30) String roomNumber,
            @JsonAlias({"Sharing"}) @Size(max = 10) String sharing,
            @JsonAlias({"CollegeName"}) @Size(max = 180) String collegeName,
            @JsonAlias({"CourseNameandYear", "courseNameAndYear"}) @Size(max = 120) String courseNameAndYear,
            @JsonAlias({"Mobilenumber"}) @Size(max = 30) String mobileNumber,
            @JsonAlias({"PMobilenumber"}) @Size(max = 30) String parentMobileNumber,
            @Size(max = 500) String address,
            @JsonAlias({"AmountPerMonth"}) @DecimalMin(value = "0.00") BigDecimal amountPerMonth,
            @JsonAlias({"StartingDate"}) LocalDate startingDate,
            Boolean active) {}
    public record PaymentRequest(
            @NotNull Long studentId,
            @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
            @Min(1) @Max(12) int month,
            @Min(2000) @Max(2200) int year,
            LocalDate paymentDate,
            @Size(max = 120) String transactionId) {}
    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {}
    public record RoomResponse(
            Long id,
            String roomNumber,
            int capacity,
            long occupiedBeds,
            BigDecimal monthlyRate,
            boolean active,
            String sharing,
            String floor,
            List<String> studentNames) {
        public RoomResponse(Long id, String roomNumber, int capacity, long occupiedBeds,
                            BigDecimal monthlyRate, boolean active) {
            this(id, roomNumber, capacity, occupiedBeds, monthlyRate, active,
                    capacity + " Sharing",
                    roomNumber != null && roomNumber.startsWith("2") ? "2nd Floor" :
                    roomNumber != null && roomNumber.startsWith("3") ? "3rd Floor" : "1st Floor",
                    List.of());
        }
    }
    public record DashboardResponse(long totalStudents, long activeStudents, long totalRooms,
                                    long occupiedRooms, long availableRooms, long paidThisMonth,
                                    long unpaidThisMonth, BigDecimal revenueThisMonth) {}
    public record StudentResponse(
            Long id,
            @JsonProperty("_id") Long legacyId,
            String studentName,
            @JsonProperty("StudentName") String legacyStudentName,
            String email,
            @JsonProperty("Email") String legacyEmail,
            String roomNumber,
            @JsonProperty("RoomNumber") String legacyRoomNumber,
            String sharing,
            @JsonProperty("Sharing") String legacySharing,
            String collegeName,
            @JsonProperty("CollegeName") String legacyCollegeName,
            String courseNameAndYear,
            @JsonProperty("CourseNameandYear") String legacyCourseNameAndYear,
            String mobileNumber,
            @JsonProperty("Mobilenumber") String legacyMobileNumber,
            String parentMobileNumber,
            @JsonProperty("PMobilenumber") String legacyParentMobileNumber,
            String address,
            BigDecimal amountPerMonth,
            @JsonProperty("AmountPerMonth") BigDecimal legacyAmountPerMonth,
            LocalDate startingDate,
            @JsonProperty("StartingDate") LocalDate legacyStartingDate,
            String status,
            boolean isActive,
            String paymentstatus) {}
    public record PaymentResponse(
            Long id,
            @JsonProperty("_id") Long legacyId,
            BigDecimal amount,
            String date,
            String status,
            String month,
            int year,
            String receiptNumber) {}
    public record PaymentConfirmationResponse(
            Long id,
            Long studentId,
            String studentName,
            String studentEmail,
            String roomNumber,
            BigDecimal amount,
            String month,
            int year,
            String status,
            Instant requestedAt,
            Instant updatedAt,
            Long paymentId) {}
    public record PaymentConfirmationDateRequest(@NotNull LocalDate paymentDate) {}
    public record StudentPaymentsResponse(
            @JsonProperty("_id") Long legacyId,
            String studentName,
            String roomNumber,
            BigDecimal Amount,
            List<PaymentResponse> payments) {}
    public record UserResponse(Long id, String email, String role) {}
    public record RoommateResponse(
            Long id,
            String name,
            String courseAndYear,
            String collegeName,
            String email,
            String mobileNumber) {}
    public record StudentRoomDetailResponse(
            boolean hasRoom,
            Long roomId,
            String roomNumber,
            int capacity,
            long occupiedBeds,
            long availableBeds,
            BigDecimal monthlyRate,
            boolean active,
            String sharing,
            List<RoommateResponse> roommates,
            List<String> amenities,
            String hostelName,
            String floor,
            String wardenContact,
            String status) {}
    public record AdminPaymentRequestDto(Long studentId, Integer month, Integer year) {}
}


