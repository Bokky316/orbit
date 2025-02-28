package com.orbit.service;

import com.orbit.entity.RefreshToken;
import com.orbit.repository.StoredRefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StoredRefreshTokenService {
    private final StoredRefreshTokenRepository repository;

    public RefreshToken findByToken(String token) {
        return repository.findByRefreshToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Token not found"));
    }
}
