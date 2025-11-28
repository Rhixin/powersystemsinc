// src/app/dashboard/fill-up-form/page.tsx
import React from 'react';
import DeutzServiceForm from '@/components/DeutzServiceForm';

const FillUpFormPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Fill Up Form</h1>
          <p className="text-gray-600">Select a form type below to start filling up a service report.</p>
      </div>
      
      <DeutzServiceForm />
    </div>
  );
};

export default FillUpFormPage;