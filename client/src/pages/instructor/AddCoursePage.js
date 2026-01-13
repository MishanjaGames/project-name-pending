import React from 'react';
import AddCourseForm from '../../components/AddCourseForm';
import { SettingsContext } from '../../contexts/SettingsContext';
import { useContext } from 'react';

export default function AddCoursePage() {
  const { t } = useContext(SettingsContext);

  return (
    <div className="container my-4">
      <h3>{t('course.addTitle')}</h3>
      <p className="text-muted">{t('course.addLead')}</p>
      <AddCourseForm />
    </div>
  );
}
