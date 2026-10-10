package com.example.backend.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSourceSanitizerConfiguration implements BeanPostProcessor {
    private static final Logger log = LoggerFactory.getLogger(DataSourceSanitizerConfiguration.class);

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof HikariDataSource ds) {
            if (ds.getJdbcUrl() != null && !ds.getJdbcUrl().equals(ds.getJdbcUrl().trim())) {
                log.info("Sanitized trailing whitespace/newlines from HikariDataSource URL");
                ds.setJdbcUrl(ds.getJdbcUrl().trim());
            }
            if (ds.getUsername() != null && !ds.getUsername().equals(ds.getUsername().trim())) {
                log.info("Sanitized trailing whitespace/newlines from HikariDataSource username");
                ds.setUsername(ds.getUsername().trim());
            }
            if (ds.getPassword() != null && !ds.getPassword().equals(ds.getPassword().trim())) {
                log.info("Sanitized trailing whitespace/newlines from HikariDataSource password");
                ds.setPassword(ds.getPassword().trim());
            }
        }
        return bean;
    }
}
