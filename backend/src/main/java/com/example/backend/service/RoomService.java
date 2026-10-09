package com.example.backend.service;

import com.example.backend.api.dto.ApiDtos.PageResponse;
import com.example.backend.api.dto.ApiDtos.RoomRequest;
import com.example.backend.api.dto.ApiDtos.RoomResponse;
import com.example.backend.domain.Room;
import com.example.backend.domain.Student;
import com.example.backend.repository.RoomRepository;
import com.example.backend.repository.StudentRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RoomService {
    private final RoomRepository rooms;
    private final StudentRepository students;
    private final AuditService audit;

    public RoomService(RoomRepository rooms, StudentRepository students, AuditService audit) {
        this.rooms = rooms;
        this.students = students;
        this.audit = audit;
    }

    @Transactional
    public RoomResponse create(RoomRequest request, String actor) {
        if (rooms.existsByRoomNumberIgnoreCase(request.roomNumber().trim())) {
            throw ApiException.conflict("Room number already exists");
        }
        Room room = rooms.save(new Room(request.roomNumber().trim(), request.capacity(), request.monthlyRate()));
        audit.record(actor, "ROOM_CREATED", "Room", room.getId());
        return view(room);
    }

    @Transactional(readOnly = true)
    public PageResponse<RoomResponse> list(int page, int size, Boolean available) {
        List<Room> filtered = rooms.findAll(Sort.by("roomNumber")).stream()
                .filter(room -> available == null || isAvailable(room) == available)
                .toList();
        int from = (int) Math.min((long) page * size, filtered.size());
        int to = Math.min(from + size, filtered.size());
        List<RoomResponse> content = filtered.subList(from, to).stream().map(this::view).toList();
        return new PageResponse<>(content, page, size, filtered.size(),
                (int) Math.ceil((double) filtered.size() / size));
    }

    @Transactional(readOnly = true)
    public PageResponse<RoomResponse> listOccupied(int page, int size) {
        List<Room> filtered = rooms.findAll(Sort.by("roomNumber")).stream()
                .filter(room -> !room.getStudents().isEmpty()).toList();
        int from = (int) Math.min((long) page * size, filtered.size());
        int to = Math.min(from + size, filtered.size());
        List<RoomResponse> content = filtered.subList(from, to).stream().map(this::view).toList();
        return new PageResponse<>(content, page, size, filtered.size(),
                (int) Math.ceil((double) filtered.size() / size));
    }

    @Transactional(readOnly = true)
    public RoomResponse get(Long id) {
        return view(findRoom(id));
    }

    @Transactional(readOnly = true)
    public RoomResponse forStudentAccount(Long accountId) {
        Student student = students.findByAccountId(accountId)
                .orElseThrow(() -> ApiException.notFound("Student profile not found"));
        if (student.getRoom() == null) return null;
        return view(student.getRoom());
    }

    @Transactional
    public RoomResponse update(Long id, RoomRequest request, String actor) {
        Room room = rooms.findByIdForUpdate(id).orElseThrow(() -> ApiException.notFound("Room not found"));
        rooms.findByRoomNumberIgnoreCase(request.roomNumber().trim())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> { throw ApiException.conflict("Room number already exists"); });
        if (request.capacity() < students.countByRoomId(id)) {
            throw ApiException.conflict("Room capacity cannot be less than the current occupancy");
        }
        room.update(request.roomNumber().trim(), request.capacity(), request.monthlyRate(),
                request.active() == null || request.active());
        audit.record(actor, "ROOM_UPDATED", "Room", room.getId());
        return view(room);
    }

    @Transactional
    public void delete(Long id, String actor) {
        Room room = rooms.findByIdForUpdate(id).orElseThrow(() -> ApiException.notFound("Room not found"));
        if (students.countByRoomId(id) > 0) {
            throw ApiException.conflict("Remove all students from the room before deleting it");
        }
        rooms.delete(room);
        audit.record(actor, "ROOM_DELETED", "Room", id);
    }

    @Transactional
    public void assign(Long roomId, Long studentId, String actor) {
        Student student = students.findByIdForUpdate(studentId)
                .orElseThrow(() -> ApiException.notFound("Student not found"));
        Room room = rooms.findByIdForUpdate(roomId).orElseThrow(() -> ApiException.notFound("Room not found"));
        if (!room.isActive()) throw ApiException.conflict("Room is inactive");
        if (student.getRoom() != null && student.getRoom().getId().equals(roomId)) return;
        if (students.countByRoomId(roomId) >= room.getCapacity()) {
            throw ApiException.conflict("Room has no available beds");
        }
        student.setRoom(room);
        students.save(student);
        audit.record(actor, "ROOM_ASSIGNED", "Student", studentId);
    }

    @Transactional
    public void remove(Long roomId, Long studentId, String actor) {
        Student student = students.findByIdForUpdate(studentId)
                .orElseThrow(() -> ApiException.notFound("Student not found"));
        rooms.findByIdForUpdate(roomId).orElseThrow(() -> ApiException.notFound("Room not found"));
        if (student.getRoom() == null || !student.getRoom().getId().equals(roomId)) {
            throw ApiException.conflict("Student is not assigned to this room");
        }
        student.setRoom(null);
        students.save(student);
        audit.record(actor, "ROOM_REMOVED", "Student", studentId);
    }

    @Transactional(readOnly = true)
    public List<?> students(Long roomId, java.util.function.Function<Student, ?> mapper) {
        Room room = findRoom(roomId);
        return room.getStudents().stream().map(mapper).toList();
    }

    private Room findRoom(Long id) {
        return rooms.findById(id).orElseThrow(() -> ApiException.notFound("Room not found"));
    }

    private boolean isAvailable(Room room) {
        return room.isActive() && room.getStudents().size() < room.getCapacity();
    }

    private RoomResponse view(Room room) {
        long occupancy = room.getStudents().size();
        return new RoomResponse(room.getId(), room.getRoomNumber(), room.getCapacity(), occupancy,
                room.getMonthlyRate(), room.isActive());
    }
}
