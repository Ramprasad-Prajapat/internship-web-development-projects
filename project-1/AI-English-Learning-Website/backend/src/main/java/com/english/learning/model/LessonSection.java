package com.english.learning.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lesson_sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    private String status = "Published";

    @Builder.Default
    private Integer sectionOrder = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_day_id")
    @JsonIgnore
    private LessonDay lessonDay;
}
