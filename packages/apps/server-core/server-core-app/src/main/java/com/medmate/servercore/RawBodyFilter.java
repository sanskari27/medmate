package com.medmate.servercore;

import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
public class RawBodyFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, jakarta.servlet.FilterChain chain) throws java.io.IOException, jakarta.servlet.ServletException {
        String method = request.getMethod();
        if ("GET".equals(method) || "DELETE".equals(method) || "OPTIONS".equals(method)) {
            chain.doFilter(request, response);
            return;
        }
        byte[] bytes = request.getInputStream().readAllBytes();
        request.setAttribute(PharmacyGateway.RAW_BODY, new String(bytes, StandardCharsets.UTF_8));
        chain.doFilter(new CachedBodyRequest(request, bytes), response);
    }

    private static final class CachedBodyRequest extends HttpServletRequestWrapper {
        private final byte[] bytes;

        private CachedBodyRequest(HttpServletRequest request, byte[] bytes) {
            super(request);
            this.bytes = bytes;
        }

        @Override
        public jakarta.servlet.ServletInputStream getInputStream() {
            ByteArrayInputStream input = new ByteArrayInputStream(bytes);
            return new jakarta.servlet.ServletInputStream() {
                @Override
                public boolean isFinished() {
                    return input.available() == 0;
                }

                @Override
                public boolean isReady() {
                    return true;
                }

                @Override
                public void setReadListener(jakarta.servlet.ReadListener readListener) {
                }

                @Override
                public int read() {
                    return input.read();
                }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
        }
    }
}
