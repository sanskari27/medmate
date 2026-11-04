package com.medmate.todo;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class TodoController {
    private final TodoService todos;

    public TodoController(TodoService todos) {
        this.todos = todos;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/api/todos")
    public List<TodoResponse> list() {
        return todos.list();
    }

    @PostMapping(value = "/api/todos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TodoResponse> create(
            @RequestParam("title") String title,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(todos.create(title, file));
    }

    @PatchMapping("/api/todos/{id}")
    public TodoResponse update(@PathVariable UUID id, @RequestBody PatchRequest request) {
        return todos.update(id, request.completed());
    }

    @DeleteMapping("/api/todos/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        todos.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/todos/{id}/attachment")
    public ResponseEntity<Void> attachment(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(todos.attachmentUrl(id))).build();
    }

    public record PatchRequest(Boolean completed) {
    }
}
