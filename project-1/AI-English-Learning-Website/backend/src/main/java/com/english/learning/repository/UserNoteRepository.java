package com.english.learning.repository;

import com.english.learning.model.User;
import com.english.learning.model.UserNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserNoteRepository extends JpaRepository<UserNote, Long> {
    List<UserNote> findByUserOrderByUpdatedAtDesc(User user);
}
