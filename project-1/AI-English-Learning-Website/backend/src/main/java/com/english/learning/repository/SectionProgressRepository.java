package com.english.learning.repository;

import com.english.learning.model.SectionProgress;
import com.english.learning.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SectionProgressRepository extends JpaRepository<SectionProgress, Long> {
    List<SectionProgress> findByUser(User user);
    Optional<SectionProgress> findByUserAndSectionId(User user, String sectionId);
    List<SectionProgress> findByUserAndSectionIdStartingWith(User user, String sectionIdPrefix);
}
