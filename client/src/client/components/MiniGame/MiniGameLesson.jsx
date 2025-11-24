import React, { useMemo } from "react";
import styles from "../../styles/MiniGameLesson.module.css";

const MiniGameLesson = ({ data, onNext }) => {
  const contentHtml = useMemo(() => {
    const rawHtml = data?.resources?.content || "";
    return rawHtml.trim();
  }, [data]);

  return (
    <div className={styles.lessonContainer}>
      <header className={styles.lessonHeader}>
        <h2 className={styles.lessonTitle}>{data?.prompt || "Bài học"}</h2>
        <p className={styles.lessonHint}>
          Đọc phần nội dung dưới đây để nắm kiến thức trước khi làm bài luyện tập.
        </p>
      </header>

      <section className={styles.lessonBody}>
        {contentHtml ? (
          <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        ) : (
          <p>Hiện chưa có nội dung bài học cho minigame này.</p>
        )}
      </section>

      <footer className={styles.lessonFooter}>
        <button type="button" className={styles.nextButton} onClick={onNext}>
          Đã hiểu, tiếp tục
        </button>
      </footer>
    </div>
  );
};

export default MiniGameLesson;
