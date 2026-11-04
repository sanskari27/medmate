package com.medmate.todo;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String uploadsBucket = "";
    private String uploadsPrefix = "";
    private String corsOrigin = "https://todo.medmatepharmacy.com";

    public String getUploadsBucket() {
        return uploadsBucket;
    }

    public void setUploadsBucket(String uploadsBucket) {
        this.uploadsBucket = uploadsBucket;
    }

    public String getUploadsPrefix() {
        return uploadsPrefix;
    }

    public void setUploadsPrefix(String uploadsPrefix) {
        this.uploadsPrefix = uploadsPrefix;
    }

    public String getCorsOrigin() {
        return corsOrigin;
    }

    public void setCorsOrigin(String corsOrigin) {
        this.corsOrigin = corsOrigin;
    }
}
