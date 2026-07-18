package com.english.learning.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lesson_days")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Integer dayNumber;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String rawContent;

    @Builder.Default
    private Boolean isPublished = true;

    @OneToMany(mappedBy = "lessonDay", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<LessonSection> sections = new ArrayList<>();

    @Column
    private java.time.LocalDateTime updatedAt;
}
