package com.english.learning.repository;

import com.english.learning.model.LessonDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonDayRepository extends JpaRepository<LessonDay, Long> {
    Optional<LessonDay> findByDayNumber(Integer dayNumber);
    List<LessonDay> findByIsPublishedTrueOrderByDayNumberAsc();
}
