package com.example.backend.api;

import com.example.backend.api.dto.ApiDtos.PageResponse;
import com.example.backend.api.dto.ApiDtos.RoomRequest;
import com.example.backend.api.dto.ApiDtos.RoomResponse;
import com.example.backend.api.dto.ApiDtos.StudentResponse;
import com.example.backend.security.AuthenticatedUser;
import com.example.backend.service.ApiException;
import com.example.backend.service.RoomService;
import com.example.backend.service.StudentService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@SecurityRequirement(name = "bearerAuth")
public class RoomController {
    private final RoomService rooms;
    private final StudentService students;

    public RoomController(RoomService rooms, StudentService students) {
        this.rooms = rooms;
        this.students = students;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public RoomResponse create(@Valid @RequestBody RoomRequest request,
                               @AuthenticationPrincipal AuthenticatedUser actor) {
        return rooms.create(request, actor.email());
    }

    @GetMapping
    public PageResponse<RoomResponse> list(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "100") int size) {
        validatePage(page, size);
        return rooms.list(page, size, null);
    }

    @GetMapping("/available")
    public PageResponse<RoomResponse> available(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size) {
        validatePage(page, size);
        return rooms.list(page, size, true);
    }

    @GetMapping("/occupied")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<RoomResponse> occupied(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        validatePage(page, size);
        return rooms.listOccupied(page, size);
    }

    @GetMapping("/{id}")
    public RoomResponse get(@PathVariable Long id) {
        return rooms.get(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public RoomResponse update(@PathVariable Long id, @Valid @RequestBody RoomRequest request,
                               @AuthenticationPrincipal AuthenticatedUser actor) {
        return rooms.update(id, request, actor.email());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor) {
        rooms.delete(id, actor.email());
    }

    @GetMapping("/{id}/students")
    public List<StudentResponse> students(@PathVariable Long id) {
        return rooms.students(id, students::responseFor).stream()
                .map(StudentResponse.class::cast).toList();
    }

    @PostMapping("/{roomId}/assign/{studentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void assign(@PathVariable Long roomId, @PathVariable Long studentId,
                       @AuthenticationPrincipal AuthenticatedUser actor) {
        rooms.assign(roomId, studentId, actor.email());
    }

    @PostMapping("/{roomId}/remove/{studentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void remove(@PathVariable Long roomId, @PathVariable Long studentId,
                       @AuthenticationPrincipal AuthenticatedUser actor) {
        rooms.remove(roomId, studentId, actor.email());
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw ApiException.badRequest("page must be non-negative and size must be between 1 and 100");
        }
    }
}
