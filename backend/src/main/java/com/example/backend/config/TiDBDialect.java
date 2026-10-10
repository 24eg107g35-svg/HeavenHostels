package com.example.backend.config;

import jakarta.persistence.Timeout;
import org.hibernate.dialect.DatabaseVersion;
import org.hibernate.dialect.MySQLDialect;

/**
 * Custom Hibernate dialect for TiDB.
 * TiDB does not support MySQL 8's "FOR UPDATE OF <table_alias>" syntax,
 * which causes TiDB to mistakenly treat the alias as a table name
 * (e.g., Table 'heavenshostels.s1_0' doesn't exist).
 *
 * This dialect overrides the locking clause generation to use standard "FOR UPDATE".
 */
public class TiDBDialect extends MySQLDialect {

    public TiDBDialect() {
        super();
    }

    public TiDBDialect(DatabaseVersion version) {
        super(version);
    }

    @Override
    public String getForUpdateString(String aliases) {
        return getForUpdateString();
    }

    @Override
    public String getForUpdateNowaitString(String aliases) {
        return getForUpdateNowaitString();
    }

    @Override
    public String getForUpdateSkipLockedString(String aliases) {
        return getForUpdateSkipLockedString();
    }

    @Override
    public String getWriteLockString(String aliases, int timeout) {
        return getWriteLockString(timeout);
    }

    @Override
    public String getWriteLockString(String aliases, Timeout timeout) {
        return getWriteLockString(timeout);
    }

    @Override
    public String getReadLockString(String aliases, int timeout) {
        return getReadLockString(timeout);
    }

    @Override
    public String getReadLockString(String aliases, Timeout timeout) {
        return getReadLockString(timeout);
    }
}
