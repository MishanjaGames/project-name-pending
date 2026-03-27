import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { getUser } from '../../utils/auth';
import { SettingsContext } from '../../contexts/SettingsContext';

function LiveSessionPage() {
  const { id } = useParams(); // ID курса из URL (будет названием комнаты)
  const navigate = useNavigate();
  const { theme } = useContext(SettingsContext);
  
  // Получаем текущего пользователя
  const [user] = (function(){ try { return [getUser()]; } catch (e) { return [null]; } })();    

  if (!user) {
    navigate('/login');
    return null;
  }

  // Делаем уникальное имя комнаты на основе ID курса (чтобы никто чужой не зашел)
  const roomName = `ProjectName_Course_${id}_LiveSession`;

  return (
    <div className={`min-vh-100 d-flex flex-column ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}>
      
      {/* Кастомная шапка над видео */}
      <div className="d-flex justify-content-between align-items-center p-3 bg-dark text-white shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-outline-light btn-sm" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left"></i> Back to Dashboard
          </button>
          <h5 className="mb-0 fw-bold">
            <span className="text-danger">●</span> Live Session
          </h5>
        </div>
        <div className="text-muted small">
          Room: {roomName}
        </div>
      </div>

      {/* Контейнер для Jitsi */}
      <div className="flex-grow-1" style={{ height: 'calc(100vh - 60px)' }}>
        <JitsiMeeting
          domain="meet.jit.si" // Используем бесплатный публичный сервер
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: true, // Заходить с выключенным микрофоном
            startWithVideoMuted: false, // Заходить с включенной камерой
            prejoinPageEnabled: false, // Отключаем их стартовую страницу, сразу кидаем в руму
            disableDeepLinking: true // Не предлагать скачать приложение
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_JITSI_WATERMARK: false // Убираем логотип Jitsi
          }}
          userInfo={{
            displayName: user.name || 'Student'
          }}
          getIFrameRef={(iframeRef) => { 
            iframeRef.style.height = '100%'; 
            iframeRef.style.width = '100%';
          }}
          onApiReady={(externalApi) => {
            // Тут можно отслеживать события, например когда препод завершил звонок
            externalApi.addListener('videoConferenceLeft', () => {
              navigate(-1);
            });
          }}
        />
      </div>
    </div>
  );
}

export default LiveSessionPage;