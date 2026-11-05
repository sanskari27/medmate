package com.medmate.servercore.pharmacy.support;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.Nodes;
import org.springframework.stereotype.Service;

@Service
public class SupportService {
    public ObjectNode add(ObjectNode state, String subject, String category) {
        ObjectNode row = state.objectNode();
        row.put("id", "TKT-" + Nodes.bump(state, "ticket"));
        row.put("subject", subject == null ? "" : subject);
        row.put("category", category == null || category.isBlank() ? "General" : category);
        row.put("status", "Open");
        row.put("createdAt", System.currentTimeMillis());
        state.withArray("tickets").insert(0, row);
        return row;
    }
}
