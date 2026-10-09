CREATE TABLE user_accounts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BIT NOT NULL,
    token_version BIGINT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_user_accounts PRIMARY KEY (id),
    CONSTRAINT uk_user_email UNIQUE (email)
);

CREATE TABLE rooms (
    id BIGINT NOT NULL AUTO_INCREMENT,
    room_number VARCHAR(30) NOT NULL,
    capacity INT NOT NULL,
    monthly_rate DECIMAL(10, 2) NOT NULL,
    active BIT NOT NULL,
    CONSTRAINT pk_rooms PRIMARY KEY (id),
    CONSTRAINT uk_room_number UNIQUE (room_number),
    CONSTRAINT ck_room_capacity CHECK (capacity BETWEEN 1 AND 100),
    CONSTRAINT ck_room_rate CHECK (monthly_rate >= 0)
);

CREATE TABLE students (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    room_number VARCHAR(30),
    sharing VARCHAR(10),
    college_name VARCHAR(180),
    course_name_and_year VARCHAR(120),
    mobile_number VARCHAR(30),
    parent_mobile_number VARCHAR(30),
    address VARCHAR(500),
    amount_per_month DECIMAL(10, 2) NOT NULL,
    starting_date DATE,
    status VARCHAR(20) NOT NULL,
    room_id BIGINT,
    account_id BIGINT,
    CONSTRAINT pk_students PRIMARY KEY (id),
    CONSTRAINT uk_student_email UNIQUE (email),
    CONSTRAINT uk_student_account UNIQUE (account_id),
    CONSTRAINT fk_student_room FOREIGN KEY (room_id) REFERENCES rooms (id),
    CONSTRAINT fk_student_account FOREIGN KEY (account_id) REFERENCES user_accounts (id),
    CONSTRAINT ck_student_amount CHECK (amount_per_month >= 0)
);

CREATE TABLE payments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_month INT NOT NULL,
    payment_year INT NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    period_status VARCHAR(20) GENERATED ALWAYS AS (
        CASE WHEN status <> 'CANCELLED' THEN status ELSE NULL END
    ) STORED,
    receipt_number VARCHAR(40) NOT NULL,
    transaction_id VARCHAR(120),
    CONSTRAINT pk_payments PRIMARY KEY (id),
    CONSTRAINT uk_payment_active_period UNIQUE (student_id, payment_year, payment_month, period_status),
    CONSTRAINT uk_payment_receipt_number UNIQUE (receipt_number),
    CONSTRAINT uk_payment_transaction_id UNIQUE (transaction_id),
    CONSTRAINT fk_payment_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT ck_payment_amount CHECK (amount >= 0),
    CONSTRAINT ck_payment_month CHECK (payment_month BETWEEN 1 AND 12),
    CONSTRAINT ck_payment_year CHECK (payment_year BETWEEN 2000 AND 2200)
);

CREATE TABLE audit_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_email VARCHAR(254),
    action VARCHAR(80) NOT NULL,
    entity_name VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80),
    occurred_at TIMESTAMP(6) NOT NULL,
    ip_address VARCHAR(45),
    CONSTRAINT pk_audit_logs PRIMARY KEY (id)
);

CREATE TABLE password_reset_otps (
    email VARCHAR(254) NOT NULL,
    otp_hash VARCHAR(100) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    verified BIT NOT NULL,
    CONSTRAINT pk_password_reset_otps PRIMARY KEY (email)
);

CREATE TABLE refresh_tokens (
    token_hash VARCHAR(64) NOT NULL,
    user_id BIGINT NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    revoked BIT NOT NULL,
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (token_hash),
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES user_accounts (id)
);

CREATE INDEX ix_students_room_id ON students (room_id);
CREATE INDEX ix_payments_student_period ON payments (student_id, payment_year, payment_month);
CREATE INDEX ix_audit_logs_occurred_at ON audit_logs (occurred_at);
CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);
