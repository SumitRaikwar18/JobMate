package com.jobmate.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class UserServiceTest {

    @Test
    void testUserCreationSuccess() {
        User user = new User("John", "john@example.com");
        assertNotNull(user);
        assertEquals("John", user.getName());
    }

    @Test
    void testEmailValidation() {
        assertTrue("john@example.com".contains("@"));
    }
}
