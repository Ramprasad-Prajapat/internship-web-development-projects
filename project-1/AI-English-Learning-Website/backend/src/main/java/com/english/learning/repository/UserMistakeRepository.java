package com.english.learning.repository;

import com.english.learning.model.User;
import com.english.learning.model.UserMistake;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserMistakeRepository extends JpaRepository<UserMistake, Long> {
    List<UserMistake> findByUserOrderByCreatedAtDesc(User user);
    long countByUserAndFixed(User user, boolean fixed);
}
