package com.medmate.todo;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TodoRepository {
    private final JdbcTemplate jdbc;

    public TodoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<TodoResponse> list() {
        return jdbc.query(
                "select id, title, completed, attachment_key, created_at from todos order by created_at desc",
                (rs, row) -> map(rs));
    }

    public Optional<StoredTodo> find(UUID id) {
        List<StoredTodo> rows = jdbc.query(
                "select id, title, completed, attachment_key, created_at from todos where id = ?",
                (rs, row) -> stored(rs),
                id);
        return rows.stream().findFirst();
    }

    public void insert(UUID id, String title, String attachmentKey) {
        jdbc.update(
                "insert into todos (id, title, completed, attachment_key) values (?, ?, false, ?)",
                id,
                title,
                attachmentKey);
    }

    public boolean updateCompleted(UUID id, boolean completed) {
        return jdbc.update("update todos set completed = ? where id = ?", completed, id) > 0;
    }

    public boolean delete(UUID id) {
        return jdbc.update("delete from todos where id = ?", id) > 0;
    }

    private static TodoResponse map(ResultSet rs) throws SQLException {
        StoredTodo stored = stored(rs);
        return new TodoResponse(
                stored.id(),
                stored.title(),
                stored.completed(),
                stored.attachmentKey() != null,
                stored.createdAt());
    }

    private static StoredTodo stored(ResultSet rs) throws SQLException {
        Timestamp created = rs.getTimestamp("created_at");
        String attachment = rs.getString("attachment_key");
        return new StoredTodo(
                rs.getObject("id", UUID.class),
                rs.getString("title"),
                rs.getBoolean("completed"),
                attachment,
                created == null ? Instant.now() : created.toInstant());
    }

    public record StoredTodo(UUID id, String title, boolean completed, String attachmentKey, Instant createdAt) {
        TodoResponse toResponse() {
            return new TodoResponse(id, title, completed, attachmentKey != null, createdAt);
        }
    }
}
