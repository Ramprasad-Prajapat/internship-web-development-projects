package com.english.learning.repository;

import com.english.learning.model.LessonSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonSectionRepository extends JpaRepository<LessonSection, Long> {
}
