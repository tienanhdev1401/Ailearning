import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiVideo, FiBook, FiChevronRight, FiEye, FiInbox } from 'react-icons/fi';
import { searchLessonsApi } from '../services/lessonService';
import { searchFlashcardsApi } from '../services/flashcardService';
import styles from '../styles/SearchPage.module.css';

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();

    const [lessons, setLessons] = useState([]);
    const [flashcards, setFlashcards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchResults = useCallback(async () => {
        if (!query.trim()) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const [lessonsRes, flashcardsRes] = await Promise.all([
                searchLessonsApi(query),
                searchFlashcardsApi(query)
            ]);
            
            setLessons(lessonsRes.data.data || []);
            setFlashcards(flashcardsRes.data || []);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const handleLessonNavigate = (id) => {
        navigate(`/video/${id}`);
    };

    // Filter results into categories based on keywords
    const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 0);
    
    const lessonsByTitle = lessons.filter(l => {
        const titleLower = l.title.toLowerCase();
        return keywords.some(k => titleLower.includes(k));
    });
    
    const lessonsByVocab = lessons.filter(l => {
        const titleLower = l.title.toLowerCase();
        return !keywords.some(k => titleLower.includes(k));
    });

    if (isLoading) {
        return (
            <div className={styles.searchPage}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Đang tìm kiếm kết quả cho "{query}"...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.searchPage}>
            <div className={styles.container}>
                
                <header className={styles.searchHeader}>
                    <h1 className={styles.searchTitle}>Kết quả tìm kiếm</h1>
                    <p className={styles.searchSub}>
                        Tìm thấy {lessons.length} kết quả cho từ khóa "<strong>{query}</strong>"
                    </p>
                    <div className={styles.stats}>
                        <div className={styles.statItem}>{lessons.length} bài học</div>
                        <div className={styles.statItem}>{flashcards.length} bộ flashcard</div>
                    </div>
                </header>

                {lessons.length === 0 && flashcards.length === 0 ? (
                    <div className={styles.emptyContainer}>
                        <FiInbox className={styles.emptyIcon} />
                        <h2 className={styles.emptyText}>Không tìm thấy kết quả nào phù hợp</h2>
                        <p>Hãy thử tìm kiếm với từ khóa khác hoặc kiểm tra lại chính tả.</p>
                    </div>
                ) : (
                    <>
                        {/* Flashcards Section */}
                        {flashcards.length > 0 && (
                            <section className={styles.resultsSection}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>
                                        <FiBook className={styles.sectionIcon} />
                                        Flashcards liên quan
                                    </h2>
                                </div>
                                <div className={styles.vocabGrid}>
                                    {flashcards.map(card => (
                                        <div 
                                            key={card.id} 
                                            className={styles.vocabCard}
                                            onClick={() => navigate(`/flashcards/${card.id}`)}
                                        >
                                            <div className={styles.vocabHeader}>
                                                <span className={styles.term}>{card.activity?.name || query}</span>
                                                <span className={styles.sourceTag}>{card.type}</span>
                                            </div>
                                            <div className={styles.definition}>
                                                {card.prompt}
                                            </div>
                                            <div className={styles.context}>
                                                Phát hiện từ khóa trong nội dung bài tập này.
                                            </div>
                                            <span className={styles.sourceLink}>
                                                Luyện tập ngay <FiChevronRight />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Lessons Section */}
                        {lessonsByTitle.length > 0 && (
                            <section className={styles.resultsSection}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>
                                        <FiVideo className={styles.sectionIcon} />
                                        Bài học tương ứng
                                    </h2>
                                </div>
                                <div className={styles.resultsGrid}>
                                    {lessonsByTitle.map(lesson => (
                                        <div 
                                            key={lesson.id} 
                                            className={styles.lessonCard}
                                            onClick={() => handleLessonNavigate(lesson.id)}
                                        >
                                            <div className={styles.thumbnailContainer}>
                                                <img 
                                                    src={lesson.thumbnail_url || '/placeholder-thumb.jpg'} 
                                                    alt={lesson.title} 
                                                    className={styles.thumbnail}
                                                />
                                                <span className={styles.duration}>{lesson.durationText}</span>
                                            </div>
                                            <div className={styles.lessonInfo}>
                                                <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                                                <div className={styles.lessonMeta}>
                                                    <span className={styles.levelBadge}>{lesson.level}</span>
                                                    <span><FiEye /> {lesson.views} views</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Vocabulary / Context Section */}
                        {lessonsByVocab.length > 0 && (
                            <section className={styles.resultsSection}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>
                                        <FiBook className={styles.sectionIcon} />
                                        Bài học có chứa từ vựng "{query}"
                                    </h2>
                                </div>
                                <div className={styles.vocabGrid}>
                                    {lessonsByVocab.map(lesson => (
                                        <div 
                                            key={lesson.id} 
                                            className={styles.vocabCard}
                                            onClick={() => handleLessonNavigate(lesson.id)}
                                        >
                                            <div className={styles.vocabHeader}>
                                                <span className={styles.term}>{query}</span>
                                                <span className={styles.levelBadge}>{lesson.level}</span>
                                            </div>
                                            <div className={styles.context}>
                                                Được tìm thấy trong nội dung bài học: 
                                                <strong> {lesson.title}</strong>
                                            </div>
                                            <span className={styles.sourceLink}>
                                                Xem bài học <FiChevronRight />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
