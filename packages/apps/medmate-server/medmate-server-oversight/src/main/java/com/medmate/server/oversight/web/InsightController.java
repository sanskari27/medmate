package com.medmate.server.oversight.web;

import com.medmate.server.identity.web.Current;
import com.medmate.server.oversight.InsightViews;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class InsightController {

    private final InsightService insights;

    public InsightController(InsightService insights) {
        this.insights = insights;
    }

    @GetMapping("/pharmacy-insights")
    public InsightViews.Fleet fleet(Authentication authentication) {
        return insights.fleet(Current.require(authentication));
    }

    @GetMapping("/pharmacy-insights/{id}")
    public InsightViews.One one(
            Authentication authentication, @PathVariable UUID id, @RequestParam(required = false) String range) {
        return insights.read(Current.require(authentication), id, range);
    }
}
