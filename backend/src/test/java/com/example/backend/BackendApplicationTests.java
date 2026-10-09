package com.example.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:hosteltest;DB_CLOSE_DELAY=-1;MODE=MySQL",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.flyway.enabled=false",
		"app.jwt.secret=integration-test-only-secret-with-at-least-32-chars",
		"app.bootstrap-admin.email=",
		"app.bootstrap-admin.password=",
		"spring.mail.host="
})
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
