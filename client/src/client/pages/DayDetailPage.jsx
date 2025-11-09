import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import ActivityContent from "../components/Activity/ActivityContent";
import MiniGameRenderer from "../components/MiniGame/MiniGameRender";
import { Spinner, Alert } from "react-bootstrap";

const DayDetailPage = () => {
  const { dayId } = useParams(); // lấy dayId từ route
  const [activities, setActivities] = useState([]);
  const [miniGamesMap, setMiniGamesMap] = useState({});
  const [activityIndex, setActivityIndex] = useState(0);
  const [miniGameIndex, setMiniGameIndex] = useState(-1); // -1 = chưa vào minigame
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/days/${dayId}/activities`);
        const activitiesData = res.data.data;
        setActivities(activitiesData);

        // Lấy toàn bộ minigame của từng activity
        const map = {};
        for (const ac of activitiesData) {
          const mg = await api.get(`/activities/${ac.id}/minigames`);
          map[ac.id] = mg.data;
        }
        setMiniGamesMap(map);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Không tải được activities. Vui lòng thử lại.");
        setLoading(false);
      }
    };

    fetchData();
  }, [dayId]);

  if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;

  if (error) return <Alert variant="danger">{error}</Alert>;

  // Khi đã hoàn thành tất cả activities
  if (activityIndex >= activities.length) {
    return (
      <div className="text-center mt-5">
        <h3>🎉 Hoàn thành tất cả activities của Day {dayId}!</h3>
      </div>
    );
  }

  const currentActivity = activities[activityIndex];
  const miniGames = miniGamesMap[currentActivity?.id] || [];
  const currentMiniGame = miniGames[miniGameIndex];

  const handleNext = () => {
    // Nếu đang học content -> sang minigame đầu
    if (miniGameIndex === -1 && miniGames.length > 0) {
      setMiniGameIndex(0);
    }
    // Nếu đang trong minigame -> chuyển minigame kế
    else if (miniGameIndex < miniGames.length - 1) {
      setMiniGameIndex((prev) => prev + 1);
    }
    // Nếu hết minigame -> sang activity kế
    else {
      if (activityIndex < activities.length - 1) {
        setActivityIndex((prev) => prev + 1);
        setMiniGameIndex(-1); // quay lại xem content activity
      } else {
        // Hoàn thành tất cả
        setActivityIndex(activities.length);
      }
    }
  };

  return (
    <div className="container mt-3">
      {miniGameIndex === -1 ? (
        <ActivityContent activity={currentActivity} onNext={handleNext} />
      ) : (
        <MiniGameRenderer game={currentMiniGame} onNext={handleNext} />
      )}
    </div>
  );
};

export default DayDetailPage;
