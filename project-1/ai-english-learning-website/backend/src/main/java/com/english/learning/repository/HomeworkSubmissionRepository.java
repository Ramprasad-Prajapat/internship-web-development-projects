package com.english.learning.repository;

import com.english.learning.model.HomeworkSubmission;
import com.english.learning.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HomeworkSubmissionRepository extends JpaRepository<HomeworkSubmission, Long> {
    List<HomeworkSubmission> findByUserOrderBySubmittedAtDesc(User user);
    Optional<HomeworkSubmission> findByUserAndHomeworkId(User user, String homeworkId);
}
