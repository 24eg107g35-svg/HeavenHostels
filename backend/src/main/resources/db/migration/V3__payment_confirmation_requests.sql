CREATE TABLE payment_confirmation_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    payment_month INT NOT NULL,
    payment_year INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    payment_id BIGINT,
    requested_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_payment_confirmation_requests PRIMARY KEY (id),
    CONSTRAINT fk_payment_confirmation_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT fk_payment_confirmation_payment FOREIGN KEY (payment_id) REFERENCES payments (id),
    CONSTRAINT ck_payment_confirmation_month CHECK (payment_month BETWEEN 1 AND 12),
    CONSTRAINT ck_payment_confirmation_year CHECK (payment_year BETWEEN 2000 AND 2200),
    CONSTRAINT ck_payment_confirmation_status CHECK (status IN ('PENDING', 'COMPLETED', 'REJECTED'))
);

CREATE INDEX ix_payment_confirmation_student_period
    ON payment_confirmation_requests (student_id, payment_year, payment_month, requested_at);
CREATE INDEX ix_payment_confirmation_status_requested
    ON payment_confirmation_requests (status, requested_at);
