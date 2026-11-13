package com.medmate.server.dashboard.web;

import com.medmate.server.dashboard.DashboardRules;
import com.medmate.server.identity.web.Current;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class DashboardController {

    private final DashboardService dashboard;

    public DashboardController(DashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @GetMapping("/pharmacy/dashboard")
    public DashboardRules.Snapshot read(Authentication authentication, @RequestParam(required = false) String range) {
        return dashboard.read(Current.require(authentication), range);
    }
}
