package com.medmate.todo;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TodoService {
    private final TodoRepository repository;
    private final S3Storage storage;

    public TodoService(TodoRepository repository, S3Storage storage) {
        this.repository = repository;
        this.storage = storage;
    }

    public List<TodoResponse> list() {
        return repository.list();
    }

    public TodoResponse create(String title, MultipartFile file) throws IOException {
        String clean = cleanTitle(title);
        UUID id = UUID.randomUUID();
        String key = storage.store(id, file);
        try {
            repository.insert(id, clean, key);
        } catch (RuntimeException exception) {
            storage.delete(key);
            throw exception;
        }
        return repository.find(id)
                .map(TodoRepository.StoredTodo::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Todo was not saved"));
    }

    public TodoResponse update(UUID id, Boolean completed) {
        if (completed == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "completed is required");
        }
        if (!repository.updateCompleted(id, completed)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Todo not found");
        }
        return repository.find(id)
                .map(TodoRepository.StoredTodo::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Todo not found"));
    }

    public void delete(UUID id) {
        TodoRepository.StoredTodo todo = repository.find(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Todo not found"));
        storage.delete(todo.attachmentKey());
        repository.delete(id);
    }

    public String attachmentUrl(UUID id) {
        TodoRepository.StoredTodo todo = repository.find(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Todo not found"));
        if (todo.attachmentKey() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "This todo has no file");
        }
        return storage.presign(todo.attachmentKey());
    }

    private static String cleanTitle(String title) {
        String clean = title == null ? "" : title.trim();
        if (clean.isEmpty() || clean.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title must be 1 to 200 characters");
        }
        return clean;
    }
}
