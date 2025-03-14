package com.orbit.entity.procurement;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;

public class ProjectIdGenerator implements IdentifierGenerator {

    @Override
    public Serializable generate(SharedSessionContractImplementor session, Object object) throws HibernateException {
        String prefix = "PRJ";
        String yearMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMM"));

        String query = String.format("SELECT MAX(p.projectIdentifier) FROM Project p " +
                "WHERE p.projectIdentifier LIKE 'PRJ-%s-%%'", yearMonth);

        String maxId = (String) session.createQuery(query).uniqueResult();
        int nextId = 1;

        if (maxId != null) {
            int currentId = Integer.parseInt(maxId.split("-")[2]);
            nextId = currentId + 1;
        }

        return String.format("%s-%s-%03d", prefix, yearMonth, nextId);
    }
}