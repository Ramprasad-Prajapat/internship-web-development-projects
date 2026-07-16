package com.english.learning.repository;

import com.english.learning.model.DailyProgress;
import com.english.learning.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DailyProgressRepository extends JpaRepository<DailyProgress, Long> {
    List<DailyProgress> findByUser(User user);
    Optional<DailyProgress> findByUserAndDayNumber(User user, Integer dayNumber);
    long countByUserAndCompletedTrue(User user);
}
