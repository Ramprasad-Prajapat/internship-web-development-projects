package com.english.learning.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "section_progress", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "section_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Column(name = "section_id", nullable = false)
    private String sectionId;

    @Builder.Default
    private Boolean completed = false;

    private Integer score;

    private LocalDateTime completedAt;

    @PrePersist
    public void prePersist() {
        if (completed && completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        if (completed && completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }
}
