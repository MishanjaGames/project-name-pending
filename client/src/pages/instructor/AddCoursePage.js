import React, { useContext } from 'react';
import AddCourseForm from '../../components/AddCourseForm';
import { SettingsContext } from '../../contexts/SettingsContext';

export default function AddCoursePage() {
  const { t } = useContext(SettingsContext);

  return (
    <div className="container my-4" style={{ maxWidth: '700px' }}>
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <h3 className="mb-2 fw-bold">{t('addCourseForm.addTitle')}</h3>
          <p className="text-muted mb-4">{t('addCourseForm.addLead')}</p>
          
          <AddCourseForm />
          
        </div>
      </div>
    </div>
  );
}