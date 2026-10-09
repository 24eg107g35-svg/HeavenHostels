CREATE TABLE mess_menus (
    id BIGINT NOT NULL AUTO_INCREMENT,
    menu_date DATE NOT NULL,
    breakfast VARCHAR(1000),
    lunch VARCHAR(1000),
    snacks VARCHAR(1000),
    dinner VARCHAR(1000),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_mess_menus PRIMARY KEY (id),
    CONSTRAINT uk_mess_menus_date UNIQUE (menu_date)
);

CREATE TABLE student_complaints (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_student_complaints PRIMARY KEY (id),
    CONSTRAINT fk_complaint_student FOREIGN KEY (student_id) REFERENCES students (id),
    CONSTRAINT ck_complaint_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED'))
);

CREATE TABLE student_notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    title VARCHAR(160) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    is_read BIT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_student_notifications PRIMARY KEY (id),
    CONSTRAINT fk_notification_student FOREIGN KEY (student_id) REFERENCES students (id)
);

CREATE INDEX ix_complaint_student_created ON student_complaints (student_id, created_at);
CREATE INDEX ix_notification_student_created ON student_notifications (student_id, created_at);
