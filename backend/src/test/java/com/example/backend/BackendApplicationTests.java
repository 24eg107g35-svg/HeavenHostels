package com.example.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
@AutoConfigureMockMvc
class BackendApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void contextLoads() {
	}

	@Test
	void corsPreflightAllowedForLocalhost5174() throws Exception {
		mockMvc.perform(options("/api/auth/register")
						.header("Origin", "http://localhost:5174")
						.header("Access-Control-Request-Method", "POST")
						.header("Access-Control-Request-Headers", "Content-Type,Authorization"))
				.andExpect(status().isOk())
				.andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5174"))
				.andExpect(header().string("Access-Control-Allow-Credentials", "true"));

		mockMvc.perform(options("/api/auth/login")
						.header("Origin", "http://localhost:5174")
						.header("Access-Control-Request-Method", "POST")
						.header("Access-Control-Request-Headers", "Content-Type"))
				.andExpect(status().isOk())
				.andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5174"))
				.andExpect(header().string("Access-Control-Allow-Credentials", "true"));
	}

}
