import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestService } from '@/services/requestService';
import { categoryService, Category } from '@/services/categoryService';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Alert from '@/components/common/Alert';
import { getUserFriendlyError } from '@/utils/errorMessages';

interface PrioritySliders {
  quality: number;
  price: number;
  speed: number;
  features: number;
}

interface FormData {
  // Step 1: Basic Info
  title: string;
  description: string;
  category_id: number | null;
  
  // Step 2: Budget & Delivery
  budget_min: number | null;
  budget_max: number | null;
  currency: 'EUR' | 'USD';
  delivery_date: string;
  time_flexibility: 'critical' | 'week' | 'month';
  
  // Step 3: Additional Details
  priorities: PrioritySliders;
  file_notes: string;
}

const NewRequest: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category_id: null,
    budget_min: null,
    budget_max: null,
    currency: 'EUR',
    delivery_date: '',
    time_flexibility: 'critical',
    priorities: {
      quality: 50,
      price: 50,
      speed: 50,
      features: 50,
    },
    file_notes: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAllCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle number fields
    if (['budget_min', 'budget_max', 'category_id'].includes(name)) {
      setFormData({
        ...formData,
        [name]: value ? Number(value) : null,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handlePriorityChange = (key: keyof PrioritySliders, value: number) => {
    setFormData({
      ...formData,
      priorities: {
        ...formData.priorities,
        [key]: value,
      },
    });
  };

  const validateStep = (step: number): boolean => {
    setError('');

    if (step === 1) {
      if (!formData.title.trim()) {
        setError('Title is required');
        return false;
      }
      if (formData.title.length < 5) {
        setError('Title must be at least 5 characters long');
        return false;
      }
      if (!formData.description.trim()) {
        setError('Description is required');
        return false;
      }
      if (formData.description.length < 20) {
        setError('Description must be at least 20 characters long');
        return false;
      }
    }

    if (step === 2) {
      if (formData.budget_min && formData.budget_max) {
        if (formData.budget_min > formData.budget_max) {
          setError('Minimum budget cannot be greater than maximum budget');
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only submit on the final step
    if (currentStep < 3) {
      handleNext();
      return;
    }
    
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert priorities object to JSON string for backend
      const submitData = {
        ...formData,
        priorities: JSON.stringify(formData.priorities),
      };
      
      const response = await requestService.createRequest(submitData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/customer/requests/${response.data.id}`);
        }, 2000);
      } else {
        setError(response.message || 'Failed to create request');
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      id: 1,
      name: 'Basic Info',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 2,
      name: 'Budget & Delivery',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 3,
      name: 'Additional Details',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
  ];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Request Created!</h2>
          <p className="text-gray-600 mb-6">
            Your request has been created successfully. Suppliers will start sending bids soon.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <LoadingSpinner size="sm" />
            <span>Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Request</h1>
          <p className="text-gray-600 mt-1">Tell us what custom product you need</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep >= step.id
                        ? 'bg-primary-600 text-white shadow-lg scale-110'
                        : 'bg-gray-200 text-gray-500 scale-100'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-1 mx-2 rounded transition-all ${
                      currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} className="mb-6" />
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="animate-fade-in space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>

                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Request Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Custom leather laptop bag with personalized engraving"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.title.length}/255 characters
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    className="input"
                    placeholder="Describe your custom product in detail. Include materials, dimensions, colors, special features, etc."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length} characters (minimum 20)
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Category (Optional)
                  </label>
                  {loadingCategories ? (
                    <div className="flex items-center justify-center py-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    <select
                      id="category_id"
                      name="category_id"
                      value={formData.category_id || ''}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    If not selected, our AI will automatically categorize your request
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Budget & Delivery */}
            {currentStep === 2 && (
              <div className="animate-fade-in space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Budget & Delivery</h2>

                {/* Currency */}
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                {/* Budget Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="budget_min" className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Budget
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {formData.currency === 'EUR' ? '€' : '$'}
                      </span>
                      <input
                        type="number"
                        id="budget_min"
                        name="budget_min"
                        value={formData.budget_min || ''}
                        onChange={handleChange}
                        className="input pl-8"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="budget_max" className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Budget
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {formData.currency === 'EUR' ? '€' : '$'}
                      </span>
                      <input
                        type="number"
                        id="budget_max"
                        name="budget_max"
                        value={formData.budget_max || ''}
                        onChange={handleChange}
                        className="input pl-8"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Optional: Setting a budget range helps suppliers provide accurate bids
                </p>

                {/* Delivery Date */}
                <div>
                  <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Desired Delivery Date
                  </label>
                  <input
                    type="date"
                    id="delivery_date"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="input"
                  />
                </div>

                {/* Time Flexibility */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Time Flexibility
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: 'critical', label: 'Critical', desc: 'Need it ASAP' },
                      { value: 'week', label: '1 Week', desc: 'Can wait up to a week' },
                      { value: 'month', label: '1 Month', desc: 'Can wait up to a month' },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.time_flexibility === option.value
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="time_flexibility"
                          value={option.value}
                          checked={formData.time_flexibility === option.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="font-semibold text-gray-900">{option.label}</span>
                        <span className="text-sm text-gray-600">{option.desc}</span>
                        {formData.time_flexibility === option.value && (
                          <svg
                            className="absolute top-3 right-3 w-5 h-5 text-primary-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Additional Details */}
            {currentStep === 3 && (
              <div className="animate-fade-in space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Details</h2>

                {/* Priorities */}
                <div>
                  <h3 className="block text-sm font-medium text-gray-700 mb-4">
                    Project Priorities
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Adjust the sliders to indicate what matters most to you (0 = Not Important, 100 = Very Important)
                  </p>
                  
                  <div className="space-y-6">
                    {/* Quality Priority */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Quality
                        </label>
                        <span className="text-sm font-semibold text-purple-600 min-w-[3rem] text-right">
                          {formData.priorities.quality}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.priorities.quality}
                        onChange={(e) => handlePriorityChange('quality', Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-purple"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Premium materials, craftsmanship, and attention to detail
                      </p>
                    </div>

                    {/* Price Priority */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Best Price
                        </label>
                        <span className="text-sm font-semibold text-green-600 min-w-[3rem] text-right">
                          {formData.priorities.price}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.priorities.price}
                        onChange={(e) => handlePriorityChange('price', Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Cost-effectiveness and competitive pricing
                      </p>
                    </div>

                    {/* Speed Priority */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Fast Delivery
                        </label>
                        <span className="text-sm font-semibold text-blue-600 min-w-[3rem] text-right">
                          {formData.priorities.speed}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.priorities.speed}
                        onChange={(e) => handlePriorityChange('speed', Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Quick turnaround time and urgent delivery
                      </p>
                    </div>

                    {/* Features Priority */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                          </svg>
                          Custom Features
                        </label>
                        <span className="text-sm font-semibold text-orange-600 min-w-[3rem] text-right">
                          {formData.priorities.features}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.priorities.features}
                        onChange={(e) => handlePriorityChange('features', Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-orange"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Customization options and unique specifications
                      </p>
                    </div>
                  </div>
                </div>

                {/* File Notes */}
                <div>
                  <label htmlFor="file_notes" className="block text-sm font-medium text-gray-700 mb-2">
                    File Notes (Optional)
                  </label>
                  <textarea
                    id="file_notes"
                    name="file_notes"
                    value={formData.file_notes}
                    onChange={handleChange}
                    rows={3}
                    className="input"
                    placeholder="Any additional information about files or references you might upload later"
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.file_notes.length}/1000 characters
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Request Summary</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Title:</dt>
                      <dd className="font-medium text-gray-900">{formData.title || 'Not set'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Category:</dt>
                      <dd className="font-medium text-gray-900">
                        {categories.find((c) => c.id === formData.category_id)?.name || 'Auto-categorize'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Budget:</dt>
                      <dd className="font-medium text-gray-900">
                        {formData.budget_min && formData.budget_max
                          ? `${formData.currency} ${formData.budget_min} - ${formData.budget_max}`
                          : 'Not specified'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Delivery:</dt>
                      <dd className="font-medium text-gray-900">
                        {formData.delivery_date || 'Flexible'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Flexibility:</dt>
                      <dd className="font-medium text-gray-900">
                        {formData.time_flexibility === 'critical'
                          ? 'Critical'
                          : formData.time_flexibility === 'week'
                          ? '1 Week'
                          : '1 Month'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {currentStep < 3 ? (
                <button type="button" onClick={handleNext} className="btn btn-primary">
                  Next
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Create Request
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewRequest;

