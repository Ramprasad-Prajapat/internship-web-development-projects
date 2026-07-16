package com.english.learning.repository;

import com.english.learning.model.SelfCheckSubmission;
import com.english.learning.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SelfCheckSubmissionRepository extends JpaRepository<SelfCheckSubmission, Long> {
    List<SelfCheckSubmission> findByUserOrderBySubmittedAtDesc(User user);
    List<SelfCheckSubmission> findByUserAndCheckId(User user, String checkId);
}
