import React, { useContext } from 'react';
import TeacherForm from '../../components/TeacherForm';
import { getUser } from '../../utils/auth';
import { SettingsContext } from '../../contexts/SettingsContext';

// This page shows the teacher application form. It pre-fills the email if user is logged in.
export default function TeacherRegisterPage() {
  const user = getUser();
  const { t } = useContext(SettingsContext);

  return (
    <div className="container my-4">
      <h3>{t('teacherApplicationTitle')}</h3>
      <p>{t('teacherApplicationLead')}</p>
      <TeacherForm initialEmail={user?.email} />
    </div>
  );
}
