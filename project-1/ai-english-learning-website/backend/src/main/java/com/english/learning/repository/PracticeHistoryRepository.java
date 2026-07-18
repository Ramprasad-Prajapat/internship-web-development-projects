package com.english.learning.repository;

import com.english.learning.model.PracticeHistory;
import com.english.learning.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PracticeHistoryRepository extends JpaRepository<PracticeHistory, Long> {
    List<PracticeHistory> findByUserOrderByCreatedAtDesc(User user);
    List<PracticeHistory> findTop10ByUserOrderByCreatedAtDesc(User user);
}
